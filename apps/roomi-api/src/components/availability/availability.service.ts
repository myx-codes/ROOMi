import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability } from '../../libs/dto/availability/availability';
import { AvailabilityInput } from '../../libs/dto/availability/availability.input';
import { Message } from '../../libs/enums/common.enum';
import { AvailabilityStatus } from '../../libs/enums/availability.enum';
import { parseDateOnly, formatDateOnly } from '../../libs/config';

@Injectable()
export class AvailabilityService {
    constructor(
        @InjectModel('Availability') private readonly availabilityModel: Model<Availability>,
    ) {}

    // Agent o'z dachasini ma'lum kunlarini yopishi yoki ochishi uchun
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
                        }
                    },
                    { upsert: true, returnDocument: 'after' }
                ).exec();
            } else {
                await this.availabilityModel.findOneAndDelete({
                    propertyId: new Types.ObjectId(propertyId),
                    availabilityDate,
                }).exec();
                return null;
            }
        } catch (err) {
            console.error("DETAILED ERROR:", err);
            throw new InternalServerErrorException("Availability update failed!");
        }
    }

    // Dachaning band kunlarini olish (faqat OCCUPIED / band qilingan sanalar)
    public async getPropertyAvailability(propertyId: Types.ObjectId): Promise<Availability[]> {
        const todayYmd = new Date().toISOString().split('T')[0];
        const startOfToday = parseDateOnly(todayYmd);

        const docs = await this.availabilityModel
            .find({
                propertyId,
                availabilityDate: { $gte: startOfToday },
                availabilityStatus: AvailabilityStatus.OCCUPIED,
            })
            .sort({ availabilityDate: 1 })
            .lean()
            .exec();

        return (docs as unknown as Array<{ _id: Types.ObjectId; propertyId: Types.ObjectId; availabilityDate: Date; createdAt: Date; updatedAt: Date }>).map((d) => ({
            _id: d._id,
            propertyId: d.propertyId,
            date: formatDateOnly(new Date(d.availabilityDate)),
            isBooked: true,
            memberId: d.propertyId,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
        })) as Availability[];
    }
}