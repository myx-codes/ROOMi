import { Schema } from 'mongoose';
import { CommentGroup, CommentStatus } from '../libs/enums/comment.enum';

const CommentSchema = new Schema(
    {
        commentStatus: {
            type: String,
            enum: CommentStatus,
            default: CommentStatus.ACTIVE,
        },

        commentGroup: {
            type: String,
            enum: CommentGroup,
            required: true,
        },

        commentContent: {
            type: String,
            required: true,
        },

        // ROOMi uchun: Izoh bilan birga beriladigan reyting (1 dan 5 gacha)
        commentStars: {
            type: Number,
            min: [1, "Rating cannot be less than 1"],
            max: [5, "Rating cannot be more than 5"],
        },

        // Qaysi obyektga (Property, Article yoki Member) tegishli ekanligi
        // Dynamic ref ishlatishimiz mumkin, lekin shunchaki ObjectId qolgani ham ma'qul
        commentRefId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true, 
        },

        // Izoh muallifi
        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member', // Mongoose-da Member modeliga bog'lash
        },
    },
    { 
        timestamps: true, 
        collection: 'comments' 
    },
);

// Bir xil foydalanuvchi bitta obyektga faqat bir marta izoh qoldirishi uchun (ixtiyoriy)
// CommentSchema.index({ memberId: 1, commentRefId: 1 }, { unique: true });

export default CommentSchema;