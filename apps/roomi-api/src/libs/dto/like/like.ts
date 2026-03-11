import { Field, ID, ObjectType } from '@nestjs/graphql';
import { LikeGroup } from '../../enums/like.enum';
import { Types } from 'mongoose';

@ObjectType()
export class MeLiked {
    @Field(() => ID)
    memberId: Types.ObjectId;

    @Field(() => ID)
    likeRefId: Types.ObjectId;

    @Field(() => Boolean)
    myFavorite: boolean;
}

@ObjectType()
export class Like {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => LikeGroup)
    likeGroup: LikeGroup;

    @Field(() => ID)
    likeRefId: Types.ObjectId; // Layk bosilgan obyekt (Dacha, Maqola va h.k)

    @Field(() => ID)
    memberId: Types.ObjectId; // Layk bosgan foydalanuvchi

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}