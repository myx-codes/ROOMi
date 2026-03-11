import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@ObjectType()
export class Availability {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => ID)
    propertyId: Types.ObjectId;

    @Field(() => ID)
    memberId: Types.ObjectId; // Dachaga mas'ul bo'lgan agent/ega

    @Field(() => String)
    date: string; // "YYYY-MM-DD" formati tavsiya etiladi

    @Field(() => Boolean)
    isBooked: boolean;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}