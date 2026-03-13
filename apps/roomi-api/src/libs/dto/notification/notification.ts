import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../../enums/notification.enum';

@ObjectType()
export class Notice {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => NoticeCategory)
    category: NoticeCategory;

    @Field(() => NoticeStatus)
    status: NoticeStatus;

    @Field(() => String)
    title: string;

    @Field(() => String)
    content: string;

    @Field(() => ID)
    receiverId: Types.ObjectId; // Xabarni oluvchi (masalan: Agent)

    @Field(() => ID, { nullable: true })
    creatorId?: Types.ObjectId; // Xabar yuboruvchi (masalan: Foydalanuvchi)

    @Field(() => ID, { nullable: true })
    propertyId?: Types.ObjectId; // Qaysi dacha haqida xabar

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}