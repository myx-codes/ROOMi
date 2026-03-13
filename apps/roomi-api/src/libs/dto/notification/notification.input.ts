import { Field, InputType, ID } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../../enums/notification.enum';

@InputType()
export class NoticeInput {
    @Field(() => NoticeCategory)
    category: NoticeCategory;

    @Field(() => NoticeStatus, { defaultValue: NoticeStatus.UNREAD })
    status: NoticeStatus;

    @Field(() => String)
    title: string;

    @Field(() => String)
    content: string;

    @Field(() => ID)
    receiverId: Types.ObjectId;

    @Field(() => ID, { nullable: true })
    creatorId?: Types.ObjectId;

    @Field(() => ID, { nullable: true })
    propertyId?: Types.ObjectId;
}