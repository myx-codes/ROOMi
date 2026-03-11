import { Field, InputType, Int, ID } from '@nestjs/graphql';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Types } from 'mongoose'; // Types.ObjectId uchun
import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class BoardArticleInput {
    @IsNotEmpty()
    @IsEnum(BoardArticleCategory)
    @Field(() => BoardArticleCategory)
    articleCategory: BoardArticleCategory;

    @IsNotEmpty()
    @Length(5, 100) // Sarlavha biroz jozibaliroq bo'lishi uchun min 5
    @Field(() => String)
    articleTitle: string;

    @IsNotEmpty()
    @Length(10, 5000) // Maqola mazmuni uzun bo'lishi mumkin (masalan: "Chorvoq bo'yicha qo'llanma")
    @Field(() => String)
    articleContent: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    articleImage?: string;

    memberId?: Types.ObjectId; // Back-endda AuthGuard orqali o'rnatiladi
}

@InputType()
class BAISearch {
    @IsOptional()
    @Field(() => BoardArticleCategory, { nullable: true })
    articleCategory?: BoardArticleCategory;

    @IsOptional()
    @Field(() => String, { nullable: true })
    text?: string;

    @IsOptional()
    @Field(() => ID, { nullable: true }) // GraphQL ID tipi qulayroq
    memberId?: Types.ObjectId;
}

@InputType()
export class BoardArticlesInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(['createdAt', 'updatedAt', 'articleLikes', 'articleViews'])
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => BAISearch)
    search: BAISearch;
}

@InputType()
class ABAISearch {
    @IsOptional()
    @Field(() => BoardArticleStatus, { nullable: true })
    articleStatus?: BoardArticleStatus;

    @IsOptional()
    @Field(() => BoardArticleCategory, { nullable: true })
    articleCategory?: BoardArticleCategory;
}

@InputType()
export class AllBoardArticlesInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(['createdAt', 'updatedAt', 'articleLikes', 'articleViews'])
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => ABAISearch)
    search: ABAISearch;
}