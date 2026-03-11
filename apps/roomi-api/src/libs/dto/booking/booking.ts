import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { BookingStatus } from '../../enums/booking.enum';
import { Member, TotalCounter } from '../member/member';
import { Property } from '../property/property';

@ObjectType()
export class Booking {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => BookingStatus)
    bookingStatus: BookingStatus;

    @Field(() => Date)
    bookingStart: Date; // Kelish sanasi (Check-in)

    @Field(() => Date)
    bookingEnd: Date; // Ketish sanasi (Check-out)

    @Field(() => Int)
    totalPrice: number;

    /** Legacy aliases: yil/oy/sana (YYYY-MM-DD) */
    @Field(() => String, { description: 'Check-in sanasi: YYYY-MM-DD' })
    bookingCheckIn?: string;

    @Field(() => String, { description: 'Check-out sanasi: YYYY-MM-DD' })
    bookingCheckOut?: string;

    @Field(() => Int, { description: 'Alias for totalPrice' })
    bookingPrice?: number;

    @Field(() => Int)
    bookingGuests: number;

    @Field(() => ID)
    propertyId: Types.ObjectId;

    @Field(() => ID)
    memberId: Types.ObjectId; // Bron qilgan mijoz

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    /** Aggregation orqali keladigan ma'lumotlar **/
    @Field(() => Property, { nullable: true })
    propertyData?: Property;

    @Field(() => Member, { nullable: true })
    memberData?: Member;
}

@ObjectType()
export class Bookings {
    @Field(() => [Booking])
    list: Booking[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}