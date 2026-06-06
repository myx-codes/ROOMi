import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, Bookings } from '../../libs/dto/booking/booking'; // Bookings ni ham import qiling
import { BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { AvailabilityService } from '../availability/availability.service';
import { PropertyService } from '../property/property.service';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { T } from '../../libs/types/common';
import { Booking as BookingSchemaDoc } from '../../schemas/Booking.model';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { NoticeService } from '../notifaction/notice.service';
import { NoticeCategory, NoticeStatus } from '../../libs/enums/notification.enum';
import { BookingStatus as BookingStatusEnum } from '../../libs/enums/booking.enum';

@Injectable()
export class BookingService {
    updateStatus(_id: any, PAID: any) {
        throw new Error("Method not implemented.");
    }
    getBookingById(arg0: Types.ObjectId) {
        throw new Error("Method not implemented.");
    }
    constructor(
        @InjectModel('Booking') private readonly bookingModel: Model<BookingSchemaDoc>,
        private readonly availabilityService: AvailabilityService,
        private readonly propertyService: PropertyService,
        private readonly noticeService: NoticeService,
    ) {}

    public async createBooking(memberId: Types.ObjectId, input: BookingInput): Promise<Booking> {
        const bookingStart = new Date(`${input.bookingStart}T00:00:00.000Z`);
        const bookingEnd = new Date(`${input.bookingEnd}T00:00:00.000Z`);
        let reservedDates: string[] = [];

        try {
            const pricePreview = await this.availabilityService.getPropertyPricePreview({
                propertyId: input.propertyId,
                startDate: input.bookingStart,
                endDate: input.bookingEnd,
            });

            if (pricePreview.nights <= 0) {
                throw new BadRequestException('bookingEnd must be after bookingStart');
            }

            const overlappingBooking = await this.bookingModel.findOne({
                propertyId: { $in: [new Types.ObjectId(input.propertyId), String(input.propertyId)] },
                bookingStatus: { $in: [BookingStatusEnum.WAITING, BookingStatusEnum.CONFIRMED] },
                bookingStart: { $lt: bookingEnd },
                bookingEnd: { $gt: bookingStart },
            }).lean().exec();

            if (overlappingBooking) {
                throw new BadRequestException('Selected dates are already booked');
            }

            reservedDates = await this.availabilityService.reserveBookingDates(input.propertyId, pricePreview.dates);

            const property = await this.propertyService.getProperty(null as any, input.propertyId);

            const result = await this.bookingModel.create({
                ...input,
                memberId,
                bookingStart,
                bookingEnd,
                bookingStatus: BookingStatus.CONFIRMED,
                totalPrice: pricePreview.totalPrice,
            });

            console.log('[createBooking] created booking:', {
                bookingId: String((result as any)._id),
                memberId: String((result as any).memberId),
                propertyId: String((result as any).propertyId),
                status: (result as any).bookingStatus,
            });

            try {
                await this.availabilityService.attachBookingToReservedDates(
                    input.propertyId,
                    reservedDates,
                    new Types.ObjectId((result as any)._id),
                );
            } catch (attachErr) {
                await this.bookingModel.findByIdAndDelete((result as any)._id).exec();
                throw attachErr;
            }

            try {
                await this.noticeService.createNotification({
                    category: NoticeCategory.BOOKING,
                    status: NoticeStatus.UNREAD,
                    title: 'Yangi dacha bandlov!',
                content: `${property.propertyTitle} dachangiz ${input.bookingStart} dan ${input.bookingEnd} gacha bron qilindi. Jami: ${pricePreview.totalPrice}.`,
                receiverId: property.memberId,
                creatorId: memberId,
                propertyId: input.propertyId,
            });
            } catch (noticeErr) {
                const errorMessage = noticeErr instanceof Error ? noticeErr.message : String(noticeErr);
                console.error('Booking created, but notification failed:', errorMessage);
            }


            return result as unknown as Booking;
        } catch (err) {
            if (reservedDates.length) {
                try {
                    await this.availabilityService.releaseReservedBookingDates(input.propertyId, reservedDates);
                } catch (releaseErr) {
                    console.error('Failed to release reserved dates after booking error:', releaseErr);
                }
            }

            if (err instanceof BadRequestException) {
                throw err;
            }

            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error("Error in createBooking:", err);
            throw new InternalServerErrorException("Bron qilishda xatolik yuz berdi: " + errorMessage);
        }
    }

    /** 3. FOYDALANUVCHI BRONLARINI OLISH **/
    public async getMyBookings(memberId: Types.ObjectId, input: BookingsInquiry): Promise<Bookings> {
        const { page, limit, bookingStatus } = input;
        const normalizedMemberId = shapeIntoMongoObjectId(memberId as any);
        const memberIdAsString = String(memberId);
        const match: T = {
            $or: [
                { memberId: normalizedMemberId },
                { memberId: memberIdAsString },
            ],
        };
        
        if (bookingStatus) match.bookingStatus = bookingStatus;

        const [countByObjectId, countByString] = await Promise.all([
            this.bookingModel.countDocuments({ memberId: normalizedMemberId }).exec(),
            this.bookingModel.countDocuments({ memberId: memberIdAsString }).exec(),
        ]);

        console.log('[getMyBookings] query context:', {
            memberIdRaw: memberId,
            memberIdObjectId: String(normalizedMemberId),
            memberIdString: memberIdAsString,
            bookingStatus: bookingStatus ?? null,
            countByObjectId,
            countByString,
        });
    
        const result = await this.bookingModel.aggregate([
            { $match: match },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    list: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'properties', // MongoDB-dagi collection nomi
                                localField: 'propertyId',
                                foreignField: '_id',
                                as: 'propertyData',
                            },
                        },
                        { $unwind: { path: '$propertyData', preserveNullAndEmptyArrays: true } },
                    ],
                    metaCounter: [{ $count: 'total' }],
                },
            },
        ]).exec();
    
        // Agar natija bo'sh bo'lsa, xato bermasligi uchun default qiymat
        return {
            list: result[0]?.list || [],
            metaCounter: result[0]?.metaCounter || [{ total: 0 }],
        };
    }

    /** 4. AGENTGA TEGISHLI PROPERTY BRONLARINI OLISH **/
    public async getBookingsForMyProperties(agentId: Types.ObjectId, input: BookingsInquiry): Promise<Bookings> {
        const { page, limit, bookingStatus } = input;
        const agentIdAsString = String(agentId);

        const result = await this.bookingModel.aggregate([
            ...(bookingStatus ? [{ $match: { bookingStatus } }] : []),
            {
                $addFields: {
                    propertyIdObj: {
                        $convert: {
                            input: '$propertyId',
                            to: 'objectId',
                            onError: null,
                            onNull: null,
                        },
                    },
                    memberIdObj: {
                        $convert: {
                            input: '$memberId',
                            to: 'objectId',
                            onError: null,
                            onNull: null,
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'properties',
                    localField: 'propertyIdObj',
                    foreignField: '_id',
                    as: 'propertyData',
                },
            },
            { $unwind: { path: '$propertyData', preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    $expr: {
                        $eq: [{ $toString: '$propertyData.memberId' }, agentIdAsString],
                    },
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    list: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'members',
                                localField: 'memberIdObj',
                                foreignField: '_id',
                                as: 'memberData',
                            },
                        },
                        { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
                    ],
                    metaCounter: [{ $count: 'total' }],
                },
            },
        ]).exec();

        return {
            list: result[0]?.list || [],
            metaCounter: result[0]?.metaCounter?.length ? result[0].metaCounter : [{ total: 0 }],
        };
    }
}
