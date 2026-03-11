import { Field, Int, Float, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose"; // ObjectId xatoligini oldini olish uchun Types import qilindi
import { PropertyLocation, PropertyStatus, PropertyType } from "../../enums/property.enum";
import { Member, TotalCounter } from "../member/member";
import { MeLiked } from "../like/like";

@ObjectType()
export class Property {
    @Field(() => ID)
    _id: Types.ObjectId; // SchemaType o'rniga Types.ObjectId ishlatildi

    @Field(() => PropertyType)
    propertyType: PropertyType;

    @Field(() => PropertyStatus)
    propertyStatus: PropertyStatus;

    @Field(() => PropertyLocation)
    propertyLocation: PropertyLocation;

    @Field(() => String)
    propertyAddress: string;

    @Field(() => String)
    propertyTitle: string;

    @Field(() => Float)
    propertyPrice: number; // Bir kunlik ijara narxi

    @Field(() => Float)
    propertySquare: number;

    @Field(() => Int)
    propertyBeds: number;

    @Field(() => Int)
    propertyRooms: number;

    @Field(() => Int)
    propertyViews: number;

    @Field(() => Int)
    propertyLikes: number;

    @Field(() => Int)
    propertyComments: number;

    @Field(() => Int)
    propertyRank: number;

    @Field(() => [String])
    propertyImages: string[];

    @Field(() => String, { nullable: true })
    propertyDesc?: string;

    @Field(() => Boolean)
    propertyRent: boolean; // true - ijaraga ochiq, false - yopilgan

    @Field(() => ID)
    memberId: Types.ObjectId;

    /** Ijara mantiqi uchun soldAt o'rniga quyidagilar mantiqiyroq **/
    
    @Field(() => Date, { nullable: true })
    deletedAt?: Date;

    @Field(() => Date, { nullable: true })
    constructedAt?: Date;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    /** from Aggregation **/

    @Field(() => Member, { nullable: true })
    memberData?: Member; // Obyekt egasi (Agent/Owner) haqida ma'lumot
    
    @Field(() => [MeLiked], { nullable: true })
    meLiked?: MeLiked[]; // Tizimga kirgan foydalanuvchi layk bosganmi yoki yo'q
}

@ObjectType()
export class Properties {
    @Field(() => [Property])
    list: Property[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}