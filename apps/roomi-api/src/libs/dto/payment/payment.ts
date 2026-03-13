import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../enums/payment.enum';

@ObjectType()
export class Payment {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => PaymentStatus)
    paymentStatus: PaymentStatus;

    @Field(() => PaymentMethod)
    paymentMethod: PaymentMethod;

    @Field(() => Int)
    paymentAmount: number;

    @Field(() => ID)
    bookingId: Types.ObjectId;

    @Field(() => ID)
    memberId: Types.ObjectId;

    @Field(() => String, { nullable: true })
    transactionId?: string;

    @Field(() => Date, { nullable: true })
    paidAt?: Date;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
