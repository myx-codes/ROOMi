import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Payment as PaymentSchemaDoc } from "../../schemas/Payment.model";
import { Booking as BookingSchemaDoc } from "../../schemas/Booking.model";
import { NoticeService } from "../notifaction/notice.service";
import { BookingStatus } from "../../libs/enums/booking.enum";
import { NoticeCategory, NoticeStatus } from "../../libs/enums/notification.enum";
import { PaymentMethod, PaymentStatus } from "../../libs/enums/payment.enum";
import { Payment } from "../../libs/dto/payment/payment";
import { PropertyService } from "../property/property.service";

@Injectable()
export class PaymentService {
    constructor(
        @InjectModel('Payment') private readonly paymentModel: Model<PaymentSchemaDoc>,
        @InjectModel('Booking') private readonly bookingModel: Model<BookingSchemaDoc>,
        private readonly noticeService: NoticeService,
        private readonly propertyService: PropertyService,
    ) {}

    public async checkout(
        memberId: Types.ObjectId,
        bookingId: string,
        paymentMethod: PaymentMethod = PaymentMethod.CLICK,
    ): Promise<Payment> {
        if (!Types.ObjectId.isValid(bookingId)) throw new BadRequestException('Noto‘g‘ri bookingId!');

        const bookingObjectId = new Types.ObjectId(bookingId);
        const booking = await this.bookingModel
            .findOne({ _id: bookingObjectId, memberId })
            .lean()
            .exec();

        if (!booking) throw new BadRequestException("Bron topilmadi!");
        if (booking.bookingStatus === BookingStatus.CANCELLED) {
            throw new BadRequestException("Bekor qilingan bron uchun to‘lov qilib bo‘lmaydi!");
        }

        const mockTransactionId = `TRX-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

        const payment = await this.paymentModel.create({
            bookingId: booking._id,
            memberId,
            paymentMethod,
            paymentAmount: booking.totalPrice ?? 0,
            paymentStatus: PaymentStatus.SUCCESS,
            transactionId: mockTransactionId,
            paidAt: new Date(),
        });

        await this.bookingModel
            .findByIdAndUpdate(booking._id, { bookingStatus: BookingStatus.CONFIRMED }, { returnDocument: 'after' })
            .exec();

        try {
            const property = await this.propertyService.getProperty(null as any, booking.propertyId as Types.ObjectId);
            await this.noticeService.createNotification({
                category: NoticeCategory.PAYMENT,
                status: NoticeStatus.UNREAD,
                title: "To'lov qabul qilindi",
                content: `Sizning dacha broningiz uchun ${booking.totalPrice ?? 0} miqdorida to'lov amalga oshirildi.`,
                receiverId: property.memberId,
                creatorId: memberId,
                propertyId: booking.propertyId,
            });
        } catch (noticeErr) {
            console.error('Payment created, but notification failed:', noticeErr?.message || noticeErr);
        }

        return payment as unknown as Payment;
    }
}