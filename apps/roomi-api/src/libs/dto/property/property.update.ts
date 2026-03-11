import { Field, InputType, Int, ID, Float } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min, IsArray, IsBoolean } from 'class-validator';
import { PropertyLocation, PropertyStatus, PropertyType } from '../../enums/property.enum';
import { Types } from 'mongoose';

@InputType()
export class PropertyUpdate {
    @IsNotEmpty()
    @Field(() => ID) // GraphQL ID tipi qulayroq
    _id: Types.ObjectId;

    @IsOptional()
    @Field(() => PropertyType, { nullable: true })
    propertyType?: PropertyType;

    @IsOptional()
    @Field(() => PropertyStatus, { nullable: true })
    propertyStatus?: PropertyStatus;

    @IsOptional()
    @Field(() => PropertyLocation, { nullable: true })
    propertyLocation?: PropertyLocation;

    @IsOptional()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    propertyAddress?: string;

    @IsOptional()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    propertyTitle?: string;

    @IsOptional()
    @Min(0)
    @Field(() => Float, { nullable: true }) // Narx butun son bo'lmasligi mumkin
    propertyPrice?: number;

    @IsOptional()
    @Min(1)
    @Field(() => Float, { nullable: true })
    propertySquare?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Field(() => Int, { nullable: true })
    propertyBeds?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Field(() => Int, { nullable: true })
    propertyRooms?: number;

    @IsOptional()
    @IsArray()
    @Field(() => [String], { nullable: true })
    propertyImages?: string[];

    @IsOptional()
    @Length(5, 500)
    @Field(() => String, { nullable: true })
    propertyDesc?: string;

    @IsOptional()
    @IsBoolean()
    @Field(() => Boolean, { nullable: true })
    propertyRent?: boolean; // Bo'sh yoki Band ekanligini yangilash uchun

    // soldAt olib tashlandi (ijarada shart emas)
    
    deletedAt?: Date; // Buni admin yoki tizim o'zi boshqaradi

    @IsOptional()
    @Field(() => Date, { nullable: true })
    constructedAt?: Date;
}