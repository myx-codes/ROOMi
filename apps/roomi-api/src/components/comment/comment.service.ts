import { BadRequestException, Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MemberService } from '../member/member.service';
import { PropertyService } from '../property/property.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';
import { RatingService } from '../rating/rating.service';

@Injectable()
export class CommentService implements OnModuleInit {
    private legacyCommentIndexChecked = false;

    constructor(
        @InjectModel('Comment') private readonly commentModel: Model<Comment>,
        private readonly memberService: MemberService,
        private readonly propertyService: PropertyService,
        private readonly boardArticleService: BoardArticleService,
        private readonly ratingService: RatingService,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.dropLegacyCommentUniqueIndex();
    }

    private async dropLegacyCommentUniqueIndex(): Promise<void> {
        if (this.legacyCommentIndexChecked) return;

        try {
            const indexes = await this.commentModel.collection.indexes();
            for (const index of indexes) {
                const key = index?.key ?? {};
                const isLegacyUnique = index?.unique && key.memberId === 1 && key.commentRefId === 1;
                const indexName = index?.name;

                if (isLegacyUnique && indexName) {
                    await this.commentModel.collection.dropIndex(indexName);
                    console.log(`Dropped legacy comment unique index: ${indexName}`);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.log('Legacy comment index cleanup skipped:', errorMessage);
        } finally {
            this.legacyCommentIndexChecked = true;
        }
    }
    
    public async createComment(memberId: Types.ObjectId, input: CommentInput): Promise<Comment> {
        await this.dropLegacyCommentUniqueIndex();
        input.memberId = memberId;

        let result: Comment | null = null;
        try {
            result = await this.commentModel.create(input);
        } catch (err) {
            console.log('Error, Service.model:', err);
            throw new BadRequestException(Message.CREATE_FAILED);
        }

        switch (input.commentGroup) {
            case CommentGroup.PROPERTY:
                await this.propertyService.propertyStatsEditor({
                    _id: input.commentRefId,
                    targetKey: 'propertyComments',
                    modifier: 1,
                });
                if (typeof input.commentStars === 'number') {
                    await this.ratingService.upsertPropertyRatingByComment({
                        commentId: result._id,
                        memberId,
                        propertyId: input.commentRefId,
                        ratingValue: input.commentStars,
                    });
                }
                break;
            case CommentGroup.ARTICLE:
                await this.boardArticleService.boardArticleStatsEditor({
                    _id: input.commentRefId,
                    targetKey: 'articleComments',
                    modifier: 1,
                });
                break;
            case CommentGroup.MEMBER:
                await this.memberService.memberStatsEditor({
                    _id: input.commentRefId,
                    targetKey: 'memberComments',
                    modifier: 1,
                });
                break;
        }

        if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
        return result;
    };



    public async updateComment(memberId: Types.ObjectId, input: CommentUpdate): Promise<Comment> {
        const { _id } = input;

        const result = await this.commentModel.findOneAndUpdate(
            {
                _id: _id,
                memberId: memberId,
                commentStatus: CommentStatus.ACTIVE,
            },
            input,
            { new: true, runValidators: true },
        );

        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        if (typeof input.commentStars === 'number' && result.commentGroup === CommentGroup.PROPERTY) {
            await this.ratingService.upsertPropertyRatingByComment({
                commentId: result._id,
                memberId,
                propertyId: result.commentRefId,
                ratingValue: input.commentStars,
            });
        }

        return result;
    };



    public async getComments(memberId: Types.ObjectId, input: CommentsInquiry): Promise<Comments> {
        const { commentRefId } = input.search;
        const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        const result: Comments[] = await this.commentModel.aggregate([
            { $match: match },
            { $sort: sort },
            {
                $facet: {
                    list: [
                        { $skip: (input.page - 1) * input.limit },
                        { $limit: input.limit },
                        // meLiked
                        lookupMember,
                        { $unwind: '$memberData' },
                    ],
                    metaCounter: [{ $count: 'total' }],
                },
            },
        ]);

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    };



    public async removeCommentByAdmin(input: Types.ObjectId): Promise<Comment> {
        const result = await this.commentModel.findByIdAndDelete(input);
        if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

        if (result.commentGroup === CommentGroup.PROPERTY) {
            await this.ratingService.removePropertyRatingByComment(result._id);
        }

        return result;
    }





}