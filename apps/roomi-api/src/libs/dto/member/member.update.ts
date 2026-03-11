import { InputType, Field } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, Length, IsEnum, Matches } from "class-validator";
import { MemberStatus, MemberType } from "../../enums/member.enum";
import {Types} from "mongoose";

@InputType()
export class MemberUpdate {
    
    @IsNotEmpty()
    @Field(() => String)
    _id: Types.ObjectId;
    
    @IsOptional()
    @IsEnum(MemberType)
    @Field(() => MemberType, { nullable: true })
    memberType?: MemberType;

    @IsOptional()
    @IsEnum(MemberStatus)
    @Field(() => MemberStatus, { nullable: true })
    memberStatus?: MemberStatus;
    
    @IsOptional()
    @Matches(/^\+998\d{9}$/, { message: "Phone number must be valid (+998XXXXXXXXX)" })
    @Field(() => String, { nullable: true })
    memberPhone?: string;

    @IsOptional()
    @Length(3, 20)
    @Field(() => String, { nullable: true })
    memberNick?: string;

    @IsOptional()
    @Length(6, 25)
    @Field(() => String, { nullable: true })
    memberPassword?: string;

    @IsOptional()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    memberFullName?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberImage?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberAddress?: string;
    
    @IsOptional()
    @Length(10, 500) // Tavsif biroz uzunroq bo'lishi mumkin
    @Field(() => String, { nullable: true })
    memberDesc?: string;

    // deletedAt odatda tashqaridan update qilinmaydi (Soft delete uchun ishlatiladi)
    // Lekin mantiqan kerak bo'lsa qoldirish mumkin
    @IsOptional()
    @Field(() => Date, { nullable: true })
    deletedAt?: Date;
}