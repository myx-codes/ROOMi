import { InputType, Field, Int } from "@nestjs/graphql";
import { IsIn, IsNotEmpty, IsOptional, Length, Min, IsEnum, Matches } from "class-validator";
import { MemberAuthType, MemberStatus, MemberType } from "../../enums/member.enum";
import { availableAgentSorts, availableMemberSorts } from "../../config";
import { Direction } from "../../enums/common.enum";

// --- MEMBER REGISTRATION INPUT ---
@InputType()
export class MemberInput {
    @IsNotEmpty()
    @Length(3, 20)
    @Field(() => String)
    memberNick: string;

    @IsNotEmpty()
    @Length(6, 25) // Xavfsizlik uchun minimal 6 ta belgi
    @Field(() => String)
    memberPassword: string;

    @IsNotEmpty()
    @Field(() => String)
    memberPhone: string

    // @IsNotEmpty()
    // // Regex tushuntirishi: + belgisi bilan boshlanadi va undan keyin 7 tadan 15 tagacha raqam keladi
    // @Matches(/^\+\d{7,15}$/, { 
    //     message: "Phone number must be a valid international format (+1234567890)" 
    // })

    @IsOptional()
    @IsEnum(MemberType)
    @Field(() => MemberType, { nullable: true, defaultValue: MemberType.USER })
    memberType?: MemberType;

    @IsOptional()
    @IsEnum(MemberAuthType)
    @Field(() => MemberAuthType, { nullable: true })
    memberAuthType?: MemberAuthType;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberFullName?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberImage?: string;
}

// --- LOGIN INPUT ---
@InputType()
export class LoginInput {
    @IsNotEmpty()
    @Field(() => String)
    memberNick: string;

    @IsNotEmpty()
    @Field(() => String)
    memberPassword: string;
}

// --- SEARCH OBJECTS ---
@InputType()
class AISearch {
    @IsOptional()
    @Field(() => String, { nullable: true })
    text?: string;
}

@InputType()
class MISearch {
    @IsOptional()
    @IsEnum(MemberStatus)
    @Field(() => MemberStatus, { nullable: true })
    memberStatus?: MemberStatus;

    @IsOptional()
    @IsEnum(MemberType)
    @Field(() => MemberType, { nullable: true })
    memberType?: MemberType;

    @IsOptional()
    @Field(() => String, { nullable: true })
    text?: string;
}

// --- INQUIRY INPUTS (Pagination & Sort) ---
@InputType()
export class AgentsInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableAgentSorts)
    @Field(() => String, { nullable: true })
    sort?: number
    // sort?: string;  Sort odatda string bo'ladi (masalan: 'createdAt')


    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => AISearch)
    search: AISearch;
}

@InputType()
export class MembersInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableMemberSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => MISearch)
    search: MISearch;
}