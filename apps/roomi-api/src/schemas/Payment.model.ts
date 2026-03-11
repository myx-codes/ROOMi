import { Schema, Types } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '../libs/enums/payment.enum';

const PaymentSchema = new Schema(
    {
        paymentStatus: {
            type: String,
            enum: PaymentStatus,
            default: PaymentStatus.PENDING,
        },

        paymentMethod: {
            type: String,
            enum: PaymentMethod,
            required: true,
        },

        // To'lov miqdori
        paymentAmount: {
            type: Number,
            required: true,
        },

        // Qaysi bron uchun to'lov qilinmoqda
        bookingId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Booking',
        },

        // To'lovni amalga oshirgan foydalanuvchi
        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        // Tashqi to'lov tizimidan keladigan tranzaksiya IDsi (Click/Payme ID)
        transactionId: {
            type: String,
            default: null,
        },

        // To'lov vaqti (muvaffaqiyatli bo'lgan payt)
        paidAt: {
            type: Date,
            default: null,
        },
    },
    { 
        timestamps: true, 
        collection: 'payments' 
    },
);

// Tranzaksiya ID bo'yicha tez qidirish uchun
PaymentSchema.index({ transactionId: 1 }, { sparse: true });

export default PaymentSchema;