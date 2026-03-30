import { Schema } from "mongoose";
import { 
    MemberAuthType, 
    MemberStatus, 
    MemberType 
} from "../libs/enums/member.enum";

const MemberScheme = new Schema({
    memberType: {
        type: String,
        enum: MemberType,
        // ROOMi rollari: USER, OWNER, MANAGER, ADMIN
        default: MemberType.USER 
    },

    memberStatus: {
        type: String,
        enum: MemberStatus,
        default: MemberStatus.ACTIVE
    },

    memberAuthType: {
        type: String,
        enum: MemberAuthType,
        default: MemberAuthType.PHONE
    },

    // --- Identifikatsiya ---
    memberPhone: {
        type: String,
        index: { unique: true, sparse: true },
        required: true // 'require' emas 'required' bo'lishi kerak
    },

    memberNick: {
        type: String,
        index: { unique: true, sparse: true },
        required: true
    },

    memberPassword: {
        type: String,
        select: false,
        required: true
    },

    memberFullName: {
        type: String,
    },

    // --- ROOMi Maxsus Fieldlar ---
    
    // Agar foydalanuvchi MANAGER bo'lsa, uni qaysi OWNER tayinlagan?
    parentOwnerId: {
        type: Schema.Types.ObjectId,
        ref: 'members',
        default: null
    },

    // Foydalanuvchi verifikatsiyadan o'tganmi? (Dacha egalari uchun muhim)
    memberVerified: {
        type: Boolean,
        default: false
    },

    memberImage: {
        type: String,
        default: ""
    },

    // --- Statistika (Aggregatsiya uchun) ---
    memberProperties: {
        type: Number,
        default: 0
    },

    memberArticles: {
        type: Number,
        default: 0
    },
    

    memberBookings: { // 'memberArticles' o'rniga Booking muhimroq
        type: Number,
        default: 0
    },

    memberPoints: {
        type: Number,
        default: 0
    },

    memberLikes: {
        type: Number,
        default: 0
    },

    memberViews: {
        type: Number,
        default: 0
    },

    memberComments: {
        type: Number,
        default: 0
    },

    memberRank: {
        type: Number,
        default: 0
    },

    // --- Xavfsizlik va Jarimalar ---
    memberWarnings: {
        type: Number,
        default: 0
    },

    memberBlocks: {
        type: Number,
        default: 0
    },

    deletedAt: {
        type: Date
    }

}, { timestamps: true, collection: "members" });

export default MemberScheme;