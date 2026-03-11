import mongoose, { Schema } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../libs/enums/notification.enum';

const NoticeSchema = new Schema(
    {
        noticeCategory: {
            type: String,
            enum: NoticeCategory,
            required: true,
        },

        noticeStatus: {
            type: String,
            enum: NoticeStatus,
            default: NoticeStatus.ACTIVE,
        },

        noticeTitle: {
            type: String,
            required: true,
        },

        noticeContent: {
            type: String,
            required: true,
        },

        // Qo'shimcha: E'lonlar uchun rasm (ixtiyoriy)
        noticeImage: {
            type: String,
        },
        
        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member', // E'lonni yaratgan admin
        },
    },
    { timestamps: true, collection: 'notices' },
);

// Sarlavha bo'yicha qidiruvni tezlashtirish uchun
NoticeSchema.index({ noticeTitle: 'text' });

export default NoticeSchema;