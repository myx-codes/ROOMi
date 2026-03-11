import { Schema } from 'mongoose';
import { BoardArticleCategory, BoardArticleStatus } from '../libs/enums/board-article.enum';

const BoardArticleSchema = new Schema(
    {
        articleCategory: {
            type: String,
            enum: BoardArticleCategory,
            required: true,
        },

        articleStatus: {
            type: String,
            enum: BoardArticleStatus,
            default: BoardArticleStatus.ACTIVE,
        },

        articleTitle: {
            type: String,
            required: true,
        },

        articleContent: {
            type: String,
            required: true,
        },

        articleImage: {
            type: String,
        },

        articleLikes: {
            type: Number,
            default: 0,
        },

        articleViews: {
            type: Number,
            default: 0,
        },

        articleComments: {
            type: Number,
            default: 0,
        },

        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },
    },
    { timestamps: true, collection: 'boardArticles' },
);

// Qidiruvni tezlashtirish uchun indexlar
BoardArticleSchema.index({ memberId: 1, createdAt: -1 });
BoardArticleSchema.index({ articleCategory: 1, articleStatus: 1 });

// Matn bo'yicha qidiruv (Search) uchun Compound Text Index
BoardArticleSchema.index(
    { articleTitle: 'text', articleContent: 'text' }, 
    { weights: { articleTitle: 10, articleContent: 5 }, name: 'BoardArticleTextIndex' }
);

export default BoardArticleSchema;