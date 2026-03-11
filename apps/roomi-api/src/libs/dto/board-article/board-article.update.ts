import { Field, InputType, ID } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { BoardArticleStatus } from '../../enums/board-article.enum';
import { Types } from 'mongoose'; // ObjectId xatolarini oldini olish uchun

@InputType()
export class BoardArticleUpdate {
    @IsNotEmpty()
    @Field(() => ID)
    _id: Types.ObjectId;

    @IsOptional()
    @IsEnum(BoardArticleStatus)
    @Field(() => BoardArticleStatus, { nullable: true })
    articleStatus?: BoardArticleStatus;

    @IsOptional()
    @Length(5, 100)
    @Field(() => String, { nullable: true })
    articleTitle?: string;

    @IsOptional()
    @Length(10, 5000) // Maqola matni tahrirlanganda ham katta limit saqlanishi shart
    @Field(() => String, { nullable: true })
    articleContent?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    articleImage?: string;
}