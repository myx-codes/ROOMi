import mongoose, { Schema } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../libs/enums/notification.enum';

const NoticeSchema = new Schema(
    {
        category: {
            type: String,
            enum: NoticeCategory,
            required: true,
        },

        status: {
            type: String,
            enum: NoticeStatus,
            default: NoticeStatus.UNREAD,
        },

        title: {
            type: String,
            required: true,
        },

        content: {
            type: String,
            required: true,
        },

        receiverId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        creatorId: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: 'Member',
        },

        propertyId: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: 'Property',
        },
    },
    { timestamps: true, collection: 'notices' },
);

NoticeSchema.index({ receiverId: 1, createdAt: -1 });
NoticeSchema.index({ title: 'text' });

export default NoticeSchema;