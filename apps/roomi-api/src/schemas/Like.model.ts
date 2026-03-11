import { Schema } from 'mongoose';
import { LikeGroup } from '../libs/enums/like.enum'; // LikeGroup ni import qiling

const LikeSchema = new Schema(
    {
        likeGroup: {
            type: String,
            enum: LikeGroup, // ViewGroup emas, LikeGroup bo'lishi kerak
            required: true,
        },

        // Layk bosilayotgan obyekt IDsi (Property, Article yoki Member)
        likeRefId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        
        // Layk bosgan foydalanuvchi
        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },
    },
    { 
        timestamps: true, 
        collection: 'likes' 
    },
);

/** * Muhim: Bitta foydalanuvchi bitta obyektga faqat 1 marta layk bosa oladi.
 * Agar foydalanuvchi yana layk bossa, bu indeks xato beradi va biz uni 
 * Service'da 'unlike' (o'chirish) deb hisoblaymiz.
 **/
LikeSchema.index({ memberId: 1, likeRefId: 1 }, { unique: true });

export default LikeSchema;