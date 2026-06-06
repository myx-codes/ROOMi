import { Field, InputType, ID } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Types } from 'mongoose';

@InputType()
export class AvailabilityInput {
    @IsNotEmpty()
    @Field(() => ID)
    propertyId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    // Faqat "2024-12-31" kabi formatni qabul qilish uchun regex validatsiyasi
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Sana YYYY-MM-DD formatida boʻlishi shart' })
    @Field(() => String)
    date: string;

    @IsNotEmpty()
    @IsBoolean()
    @Field(() => Boolean)
    isBooked: boolean;
}

@InputType()
export class AvailabilityPricingInquiry {
    @IsNotEmpty()
    @Field(() => ID)
    propertyId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Sana YYYY-MM-DD formatida boʻlishi shart' })
    @Field(() => String)
    startDate: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Sana YYYY-MM-DD formatida boʻlishi shart' })
    @Field(() => String)
    endDate: string;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    sessionId?: string;
}
