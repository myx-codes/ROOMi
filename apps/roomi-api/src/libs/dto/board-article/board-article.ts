import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose'; // ObjectId muammosini hal qilish uchun
import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like'; // Foydalanuvchi layk bosganini tekshirish uchun

@ObjectType()
export class BoardArticle {
    @Field(() => ID) // String o'rniga ID ishlatish professionalroq
    _id: Types.ObjectId;

    @Field(() => BoardArticleCategory)
    articleCategory: BoardArticleCategory;

    @Field(() => BoardArticleStatus)
    articleStatus: BoardArticleStatus;

    @Field(() => String)
    articleTitle: string;

    @Field(() => String)
    articleContent: string;

    @Field(() => String, { nullable: true })
    articleImage?: string;

    @Field(() => Int)
    articleViews: number;

    @Field(() => Int)
    articleLikes: number;

    @Field(() => Int)
    articleComments: number;

    @Field(() => ID)
    memberId: Types.ObjectId;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    /** from aggregation **/

    @Field(() => Member, { nullable: true })
    memberData?: Member; // Maqola muallifi haqida ma'lumotlar

    @Field(() => [MeLiked], { nullable: true })
    meLiked?: MeLiked[]; // Joriy foydalanuvchi ushbu maqolaga layk bosganmi?
}

@ObjectType()
export class BoardArticles {
    @Field(() => [BoardArticle])
    list: BoardArticle[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}