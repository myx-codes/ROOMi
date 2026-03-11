import { Schema } from 'mongoose';
import { ViewGroup } from '../libs/enums/view.enum';

const ViewSchema = new Schema(
    {
        viewGroup: {
            type: String,
            enum: ViewGroup,
            required: true,
        },

        // Ko'rilayotgan obyekt IDsi (Property, Article yoki Member)
        viewRefId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        // Ko'rgan foydalanuvchi IDsi
        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },
    },
    { 
        timestamps: true, 
        collection: 'views' 
    },
);

/** * Muhim mantiq:
 * Bitta foydalanuvchi bitta e'lonni ko'rganda bazaga faqat 1 marta yoziladi.
 * Bu orqali biz "Unique Views" (Noyob ko'rishlar) sonini hisoblaymiz.
 **/
ViewSchema.index({ memberId: 1, viewRefId: 1 }, { unique: true });

export default ViewSchema;