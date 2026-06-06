import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability } from '../../libs/dto/availability/availability';
import { AvailabilityInput, AvailabilityPricingInquiry } from '../../libs/dto/availability/availability.input';
import { Message } from '../../libs/enums/common.enum';
import { AvailabilityStatus } from '../../libs/enums/availability.enum';
import { parseDateOnly, formatDateOnly } from '../../libs/config';
import {
  calculateNightPrice,
  PricePreview,
  iterateDateRange,
} from '../../libs/pricing';
import { PropertyService } from '../property/property.service';
import { PriceBreakdownItem } from '../../libs/dto/availability/availability';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel('Availability') private readonly availabilityModel: Model<Availability>,
    private readonly propertyService: PropertyService,
  ) {}

  private buildPropertyIdFilter(propertyId: Types.ObjectId): { $in: Array<Types.ObjectId | string> } {
    return { $in: [new Types.ObjectId(propertyId), String(propertyId)] };
  }

  // Agent o'z dachasini ma'lum kungi holatini o'zgartirish yoki bronni yozish uchun
  public async updateAvailability(memberId: Types.ObjectId, input: any): Promise<Availability | null> {
    const { propertyId, date, isBooked } = input;

    try {
      const availabilityDate = parseDateOnly(date);
      if (isBooked) {
        return await this.availabilityModel.findOneAndUpdate(
          {
            propertyId: new Types.ObjectId(propertyId),
            availabilityDate,
          },
          {
            $set: {
              propertyId: new Types.ObjectId(propertyId),
              availabilityDate,
              availabilityStatus: AvailabilityStatus.OCCUPIED,
              pricePerDay: input.pricePerDay ?? 0,
            },
          },
          { upsert: true, returnDocument: 'after' },
        ).exec();
      } else {
        await this.availabilityModel.findOneAndDelete({
          propertyId: new Types.ObjectId(propertyId),
          availabilityDate,
        }).exec();
        return null;
      }
    } catch (err) {
      console.error('DETAILED ERROR:', err);
      throw new InternalServerErrorException('Availability update failed!');
    }
  }

  public async getPropertyAvailability(propertyId: Types.ObjectId): Promise<Availability[]> {
    const todayYmd = new Date().toISOString().split('T')[0];
    const startOfToday = parseDateOnly(todayYmd);

    const docs = await this.availabilityModel
      .find({
        propertyId: this.buildPropertyIdFilter(propertyId),
        availabilityDate: { $gte: startOfToday },
        availabilityStatus: AvailabilityStatus.OCCUPIED,
      })
      .sort({ availabilityDate: 1 })
      .lean()
      .exec();

    return (docs as unknown as Array<{
      _id: Types.ObjectId;
      propertyId: Types.ObjectId;
      availabilityDate: Date;
      availabilityStatus?: AvailabilityStatus;
      pricePerDay?: number;
      createdAt: Date;
      updatedAt: Date;
    }>).map((d) => ({
      _id: d._id,
      propertyId: d.propertyId,
      date: formatDateOnly(new Date(d.availabilityDate)),
      isBooked: true,
      availabilityStatus: d.availabilityStatus,
      pricePerDay: d.pricePerDay ?? 0,
      memberId: d.propertyId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })) as Availability[];
  }

  public async getPropertyPricePreview(input: AvailabilityPricingInquiry): Promise<PricePreview> {
    const property = await this.propertyService.getPropertyForPricing(new Types.ObjectId(input.propertyId));
    const dates = iterateDateRange(input.startDate, input.endDate);
    const requestedDates = dates.map((date) => formatDateOnly(date));
    const availabilityDocs = await this.availabilityModel
      .find({
        propertyId: this.buildPropertyIdFilter(new Types.ObjectId(input.propertyId)),
        availabilityDate: {
          $gte: parseDateOnly(requestedDates[0] ?? input.startDate),
          $lt: parseDateOnly(input.endDate),
        },
      })
      .lean()
      .exec();

    const availabilityMap = new Map<string, { availabilityStatus?: AvailabilityStatus; pricePerDay?: number }>();
    for (const doc of availabilityDocs as unknown as Array<{
      availabilityDate: Date;
      availabilityStatus?: AvailabilityStatus;
      pricePerDay?: number;
    }>) {
      availabilityMap.set(formatDateOnly(new Date(doc.availabilityDate)), {
        availabilityStatus: doc.availabilityStatus,
        pricePerDay: doc.pricePerDay,
      });
    }

    const breakdown = dates.map((date) => {
      const ymd = formatDateOnly(date);
      const existing = availabilityMap.get(ymd);
      const calculated = calculateNightPrice(property, date, process.env.BATCH_TIMEZONE ?? 'UTC');

      if (
        existing?.availabilityStatus === AvailabilityStatus.OCCUPIED ||
        existing?.availabilityStatus === AvailabilityStatus.MAINTENANCE
      ) {
        return {
          ...calculated,
          mode: 'LOCKED' as const,
          pricePerDay: existing.pricePerDay ?? calculated.pricePerDay,
          multiplier: existing.pricePerDay && calculated.basePrice > 0
            ? Number((existing.pricePerDay / calculated.basePrice).toFixed(3))
            : calculated.multiplier,
          explanation: ['locked_availability'],
        };
      }

      return calculated;
    });

    const baseTotal = breakdown.reduce((sum, item) => sum + item.basePrice, 0);
    const totalPrice = breakdown.reduce((sum, item) => sum + item.pricePerDay, 0);

    return {
      dates: breakdown,
      nights: breakdown.length,
      baseTotal,
      totalPrice,
      averagePrice: breakdown.length ? Math.round(totalPrice / breakdown.length) : 0,
    };
  }

  public async reserveBookingDates(
    propertyId: Types.ObjectId,
    dates: PriceBreakdownItem[],
  ): Promise<string[]> {
    const reservedDates: string[] = [];
    const objectId = new Types.ObjectId(propertyId);
    const propertyFilter = this.buildPropertyIdFilter(objectId);

    try {
      for (const item of dates) {
        const availabilityDate = parseDateOnly(item.date);
        const reserved = await this.availabilityModel.findOneAndUpdate(
          {
            propertyId: propertyFilter,
            availabilityDate,
            $and: [
              {
                $or: [
                  { availabilityStatus: { $exists: false } },
                  { availabilityStatus: AvailabilityStatus.AVAILABLE },
                ],
              },
              {
                $or: [{ bookingId: { $exists: false } }, { bookingId: null }],
              },
            ],
          },
          {
            $setOnInsert: {
              propertyId: objectId,
              availabilityDate,
            },
            $set: {
              availabilityStatus: AvailabilityStatus.OCCUPIED,
              pricePerDay: item.pricePerDay,
              bookingId: null,
            },
          },
          { upsert: true, returnDocument: 'after' },
        ).exec();

        if (!reserved) {
          throw new BadRequestException(`Selected date is no longer available: ${item.date}`);
        }

        reservedDates.push(item.date);
      }

      return reservedDates;
    } catch (err) {
      await this.releaseReservedBookingDates(objectId, reservedDates);
      const code = typeof err === 'object' && err !== null && 'code' in err ? (err as any).code : null;
      if (code === 11000) {
        throw new BadRequestException('Selected dates are already booked');
      }
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw err;
    }
  }

  public async attachBookingToReservedDates(
    propertyId: Types.ObjectId,
    dates: string[],
    bookingId: Types.ObjectId,
  ): Promise<void> {
    if (!dates.length) return;

    await this.availabilityModel.updateMany(
      {
        propertyId: this.buildPropertyIdFilter(new Types.ObjectId(propertyId)),
        availabilityDate: { $in: dates.map((date) => parseDateOnly(date)) },
        availabilityStatus: AvailabilityStatus.OCCUPIED,
      },
      {
        $set: {
          bookingId,
        },
      },
    ).exec();
  }

  public async releaseReservedBookingDates(propertyId: Types.ObjectId, dates: string[]): Promise<void> {
    if (!dates.length) return;

    await this.availabilityModel.deleteMany({
      propertyId: this.buildPropertyIdFilter(new Types.ObjectId(propertyId)),
      availabilityDate: { $in: dates.map((date) => parseDateOnly(date)) },
      bookingId: null,
      availabilityStatus: AvailabilityStatus.OCCUPIED,
    }).exec();
  }
}
