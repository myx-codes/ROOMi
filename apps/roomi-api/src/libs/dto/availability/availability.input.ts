import { Field, InputType, ID } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsString, Matches } from 'class-validator';
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