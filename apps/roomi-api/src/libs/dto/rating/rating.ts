import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { CommentGroup } from '../../enums/comment.enum';

@ObjectType()
export class Rating {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => ID)
    ratingCommentId: Types.ObjectId;

    @Field(() => CommentGroup)
    ratingGroup: CommentGroup;

    @Field(() => ID)
    ratingRefId: Types.ObjectId;

    @Field(() => Int)
    ratingValue: number;

    @Field(() => ID)
    memberId: Types.ObjectId;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
