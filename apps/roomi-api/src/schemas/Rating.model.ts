import { Schema } from 'mongoose';
import { CommentGroup } from '../libs/enums/comment.enum';

const RatingSchema = new Schema(
    {
        ratingCommentId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        ratingGroup: {
            type: String,
            enum: CommentGroup,
            required: true,
        },

        ratingRefId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        ratingValue: {
            type: Number,
            required: true,
            min: [1, 'Rating cannot be less than 1'],
            max: [5, 'Rating cannot be more than 5'],
            validate: {
                validator: Number.isInteger,
                message: 'Rating must be an integer between 1 and 5',
            },
        },

        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },
    },
    {
        timestamps: true,
        collection: 'ratings',
    },
);

RatingSchema.index(
    { ratingCommentId: 1, ratingGroup: 1 },
    { unique: true, partialFilterExpression: { ratingCommentId: { $exists: true } } },
);
RatingSchema.index({ ratingGroup: 1, ratingRefId: 1 });

export default RatingSchema;
