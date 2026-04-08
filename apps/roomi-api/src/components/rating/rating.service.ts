import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property } from '../../libs/dto/property/property';
import { Rating } from '../../libs/dto/rating/rating';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class RatingService implements OnModuleInit {
    private legacyRatingIndexChecked = false;

    constructor(
        @InjectModel('Rating') private readonly ratingModel: Model<Rating>,
        @InjectModel('Property') private readonly propertyModel: Model<Property>,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.dropLegacyRatingUniqueIndex();
    }

    private async dropLegacyRatingUniqueIndex(): Promise<void> {
        if (this.legacyRatingIndexChecked) return;

        try {
            const indexes = await this.ratingModel.collection.indexes();
            for (const index of indexes) {
                const key = index?.key ?? {};
                const isLegacyUnique =
                    index?.unique &&
                    key.memberId === 1 &&
                    key.ratingRefId === 1 &&
                    key.ratingGroup === 1;
                const indexName = index?.name;

                if (isLegacyUnique && indexName) {
                    await this.ratingModel.collection.dropIndex(indexName);
                    console.log(`Dropped legacy rating unique index: ${indexName}`);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.log('Legacy rating index cleanup skipped:', errorMessage);
        } finally {
            this.legacyRatingIndexChecked = true;
        }
    }

    public async upsertPropertyRatingByComment(input: {
        commentId: Types.ObjectId;
        memberId: Types.ObjectId;
        propertyId: Types.ObjectId;
        ratingValue: number;
    }): Promise<void> {
        await this.dropLegacyRatingUniqueIndex();
        const { commentId, memberId, propertyId, ratingValue } = input;
        const search = {
            ratingCommentId: commentId,
            ratingGroup: CommentGroup.PROPERTY,
        };

        await this.ratingModel.findOneAndUpdate(
            search,
            {
                ratingCommentId: commentId,
                memberId,
                ratingRefId: propertyId,
                ratingGroup: CommentGroup.PROPERTY,
                ratingValue,
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            },
        );

        await this.recalculatePropertyRank(propertyId);
    }

    public async removePropertyRatingByComment(commentId: Types.ObjectId): Promise<void> {
        const deletedRating = await this.ratingModel.findOneAndDelete({
            ratingCommentId: commentId,
            ratingGroup: CommentGroup.PROPERTY,
        });

        if (deletedRating) {
            await this.recalculatePropertyRank(deletedRating.ratingRefId);
        }
    }

    private async recalculatePropertyRank(propertyId: Types.ObjectId): Promise<void> {
        const [summary] = await this.ratingModel.aggregate<{
            avgRating: number;
            totalRatings: number;
        }>([
            {
                $match: {
                    ratingGroup: CommentGroup.PROPERTY,
                    ratingRefId: propertyId,
                },
            },
            {
                $group: {
                    _id: '$ratingRefId',
                    avgRating: { $avg: '$ratingValue' },
                    totalRatings: { $sum: 1 },
                },
            },
        ]);

        const propertyRank = summary?.avgRating ? Number(summary.avgRating.toFixed(2)) : 0;
        const propertyRatingCount = summary?.totalRatings ?? 0;

        const updatedProperty = await this.propertyModel.findByIdAndUpdate(
            propertyId,
            {
                propertyRank,
                propertyRatingCount,
            },
            { new: true },
        );

        if (!updatedProperty) {
            throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        }
    }
}
