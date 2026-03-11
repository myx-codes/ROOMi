import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus } from '../libs/enums/booking.enum';

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking extends Document {
    @Prop({
        type: String,
        enum: BookingStatus,
        default: BookingStatus.WAITING,
    })
    bookingStatus: BookingStatus;

    @Prop({
        type: Types.ObjectId,
        ref: 'Property',
        required: true,
    })
    propertyId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Member',
        required: true,
    })
    memberId: Types.ObjectId; // Bron qilgan foydalanuvchi

    @Prop({
        type: Date,
        required: true,
    })
    bookingStart: Date; // Kelish sanasi (Check-in)

    @Prop({
        type: Date,
        required: true,
    })
    bookingEnd: Date; // Ketish sanasi (Check-out)

    @Prop({
        type: Number,
    })
    totalPrice: number; // Jami hisoblangan summa

    @Prop({
        type: Number,
        default: 0,
    })
    bookingGuests: number; // Mehmonlar soni
}

export const BookingSchema = SchemaFactory.createForClass(Booking);