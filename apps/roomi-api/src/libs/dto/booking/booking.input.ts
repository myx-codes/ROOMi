import { Field, InputType, Int, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, Matches, Min } from 'class-validator';
import { Types } from 'mongoose';
import { BookingStatus } from '../../enums/booking.enum';

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@InputType()
export class BookingInput {
    @Field(() => ID)
    propertyId: Types.ObjectId;

    @Field(() => String, { description: 'Check-in sana: YYYY-MM-DD' })
    @Matches(YMD_PATTERN, { message: 'bookingStart formati YYYY-MM-DD bo\'lishi kerak (masalan: 2026-05-20)' })
    bookingStart: string;

    @Field(() => String, { description: 'Check-out sana: YYYY-MM-DD' })
    @Matches(YMD_PATTERN, { message: 'bookingEnd formati YYYY-MM-DD bo\'lishi kerak (masalan: 2026-05-22)' })
    bookingEnd: string;

    @Field(() => Int)
    bookingGuests: number;

    @Field(() => Int, { nullable: true })
    totalPrice?: number;
}

@InputType()
export class BookingsInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @Field(() => BookingStatus, { nullable: true })
    bookingStatus?: BookingStatus;
}