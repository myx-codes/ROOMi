import { Field, InputType, Int, ID } from '@nestjs/graphql';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Types } from 'mongoose'; // SchemaType xatosini oldini olish uchun
import { CommentGroup } from '../../enums/comment.enum';
import { Direction } from '../../enums/common.enum';
import { availableCommentSorts } from '../../config';

@InputType()
export class CommentInput {
    @IsNotEmpty()
    @IsEnum(CommentGroup) // Faqat enumdagi qiymatlar qabul qilinadi
    @Field(() => CommentGroup)
    commentGroup: CommentGroup;

    @IsNotEmpty()
    @Length(1, 500) // 100 belgidan ko'proq imkon bergan ma'qul (dacha haqida fikrlar uzun bo'lishi mumkin)
    @Field(() => String)
    commentContent: string;

    @IsNotEmpty()
    @Field(() => ID) // ObjectId o'rniga ID tipi qulayroq
    commentRefId: Types.ObjectId;

    memberId?: Types.ObjectId; // Back-endda AuthGuard orqali biriktiriladi
}

@InputType()
class CISearch {
    @IsNotEmpty()
    @Field(() => ID)
    commentRefId: Types.ObjectId; // Qaysi dacha yoki maqolaning izohlarini qidiryapmiz?
}

@InputType()
export class CommentsInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableCommentSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => CISearch)
    search: CISearch;
}