import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import type { Types } from "mongoose";
import { MemberAuthType, MemberStatus, MemberType } from "../../enums/member.enum";
import { MeLiked } from "../like/like";


@ObjectType()
export class Member {
    @Field(() => ID)
    _id: Types.ObjectId;

    @Field(() => MemberType)
    memberType: MemberType;

    @Field(() => MemberStatus)
    memberStatus: MemberStatus;

    @Field(() => MemberAuthType)
    memberAuthType: MemberAuthType;

    @Field(() => String)
    memberPhone: string;

    @Field(() => String)
    memberNick: string;
    
    // Password xavfsizlik uchun @Field() bilan belgilanmaydi (GraphQL-da ko'rinmasligi kerak)
    memberPassword?: string;

    @Field(() => String, { nullable: true })
    memberFullName?: string;

    @Field(() => String, { nullable: true })
    memberImage?: string;

    @Field(() => String, { nullable: true })
    memberAddress?: string;

    @Field(() => String, { nullable: true })
    memberDesc?: string;

    // ROOMi loyihasi uchun hisoblagichlar
    @Field(() => Int)
    memberProperties: number; // Foydalanuvchi joylagan e'lonlar soni

    @Field(() => Int)
    memberArticles: number; // Blog/Maqolalar soni

    @Field(() => Int)
    memberFollowers: number;

    @Field(() => Int)
    memberFollowings: number;

    @Field(() => Int)
    memberPoints: number; // Gamification uchun ballar

    @Field(() => Int)
    memberLikes: number;

    @Field(() => Int)
    memberViews: number;

    @Field(() => Int)
    memberComments: number;

    @Field(() => Int)
    memberRank: number;

    @Field(() => Int)
    memberWarnings: number;

    @Field(() => Int)
    memberBlocks: number;
    
    // Vaqt ko'rsatkichlari
    @Field(() => Date, { nullable: true })
    deletedAt?: Date;
    
    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => String, { nullable: true })
    accessToken?: string;

    /** Aggregation orqali keladigan ma'lumotlar **/

    @Field(() => [MeLiked], { nullable: true })
    meLiked?: MeLiked[];

}

@ObjectType()
export class TotalCounter {
    @Field(() => Int, {nullable: true})
    total: number;
}

@ObjectType()
export class Members {
    @Field(() => [Member])
    list: Member[];

    @Field(() => [TotalCounter], {nullable: true})
    metaCounter: TotalCounter[];
}