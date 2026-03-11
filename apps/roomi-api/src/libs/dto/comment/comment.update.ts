import { Field, InputType, ID } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { CommentStatus } from '../../enums/comment.enum';
import { Types } from 'mongoose'; // ObjectId muammosini hal qilish uchun

@InputType()
export class CommentUpdate {
    @IsNotEmpty()
    @Field(() => ID) // GraphQL ID tipi
    _id: Types.ObjectId;

    @IsOptional()
    @IsEnum(CommentStatus) // Faqat enumdagi statuslarni qabul qiladi
    @Field(() => CommentStatus, { nullable: true })
    commentStatus?: CommentStatus;

    @IsOptional()
    @Length(1, 500) // Dacha sharhlari uzunroq bo'lishi mumkin
    @Field(() => String, { nullable: true })
    commentContent?: string;
}