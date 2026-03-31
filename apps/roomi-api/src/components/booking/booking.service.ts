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
import { parseDateOnly, formatDateOnly, shapeIntoMongoObjectId } from '../../libs/config';
import { NoticeService } from '../notifaction/notice.service';
import { NoticeCategory, NoticeStatus } from '../../libs/enums/notification.enum';

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
        try {
            const start = parseDateOnly(input.bookingStart);
            const end = parseDateOnly(input.bookingEnd);
            const nights = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) || 1;
            const pricePerNight = await this.propertyService.getPropertyPrice(input.propertyId);
            const totalPrice = pricePerNight * nights;
            const property = await this.propertyService.getProperty(null as any, input.propertyId);

            const result = await this.bookingModel.create({
                ...input,
                memberId,
                bookingStart: start,
                bookingEnd: end,
                bookingStatus: BookingStatus.CONFIRMED,
                totalPrice,
            });

            console.log('[createBooking] created booking:', {
                bookingId: String((result as any)._id),
                memberId: String((result as any).memberId),
                propertyId: String((result as any).propertyId),
                status: (result as any).bookingStatus,
            });

            await this.markDatesAsBooked(
                input.propertyId,
                input.bookingStart,
                input.bookingEnd,
                memberId
            );

            try {
                await this.noticeService.createNotification({
                    category: NoticeCategory.BOOKING,
                    status: NoticeStatus.UNREAD,
                    title: 'Yangi dacha bandlov!',
                    content: `${property.propertyTitle} dachangiz ${input.bookingStart} dan ${input.bookingEnd} gacha bron qilindi.`,
                    receiverId: property.memberId,
                    creatorId: memberId,
                    propertyId: input.propertyId,
                });
            } catch (noticeErr) {
                console.error('Booking created, but notification failed:', noticeErr?.message || noticeErr);
            }


            return result as unknown as Booking;
        } catch (err) {
            console.error("Error in createBooking:", err);
            throw new InternalServerErrorException("Bron qilishda xatolik yuz berdi: " + err.message);
        }
    }

    /** 2. TAQVIMNI BLOKLASH (YORDAMCHI FUNKSIYA) **/
    private async markDatesAsBooked(
        propertyId: Types.ObjectId, 
        startStr: string, 
        endStr: string, 
        memberId: Types.ObjectId
    ) {
        let current = parseDateOnly(startStr);
        const last = parseDateOnly(endStr);

        while (current.getTime() <= last.getTime()) {
            const dateStr = formatDateOnly(current);
            await this.availabilityService.updateAvailability(memberId, {
                propertyId,
                date: dateStr,
                isBooked: true,
            });
            current.setUTCDate(current.getUTCDate() + 1);
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
}