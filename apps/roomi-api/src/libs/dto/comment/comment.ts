import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose'; // ObjectId xatoligini oldini olish uchun
import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Comment {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => CommentStatus)
    commentStatus: CommentStatus;

    @Field(() => CommentGroup)
    commentGroup: CommentGroup;

    @Field(() => String)
    commentContent: string;

    @Field(() => Int, { nullable: true })
    commentStars?: number;

    @Field(() => ID)
    commentRefId: Types.ObjectId; // Dacha yoki Maqola IDsi

    @Field(() => ID)
    memberId: Types.ObjectId; // Sharh qoldirgan foydalanuvchi IDsi

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    /** from aggregation **/

    @Field(() => Member, { nullable: true })
    memberData?: Member; // Sharh egasining ma'lumotlari (ism, rasm)
}

@ObjectType()
export class Comments {
    @Field(() => [Comment])
    list: Comment[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}