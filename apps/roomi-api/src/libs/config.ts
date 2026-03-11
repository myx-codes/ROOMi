import { Types } from 'mongoose'; // bson o'rniga mongoose ishlatish tavsiya etiladi
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common';

/** SORTING CONFIGURATIONS **/
export const availableAgentSorts = ["createdAt", "updatedAt", "memberLikes", "memberViews", "memberRank"];
export const availableMemberSorts = ["createdAt", "updatedAt", "memberLikes", "memberViews"];

// Barter olib tashlandi, faqat Rent qoldi (ijara uchun)
export const availableOptions = ['propertyRent']; 

export const availablePropertySorts = [
    'createdAt',
    'updatedAt',
    'propertyLikes',
    'propertyViews',
    'propertyRank',
    'propertyPrice',
];

export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];
export const availableCommentSorts = ['createdAt', 'updatedAt'];

/** IMAGE CONFIGURATION **/
export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
    const ext = path.parse(filename).ext;
    return uuidv4() + ext;
};

/** MONGOOSE UTILS **/
export const shapeIntoMongoObjectId = (target: any) => {
    return typeof target === 'string' ? new Types.ObjectId(target) : target;
};

/** AGGREGATIONS **/

// Dacha yoki Maqolaga foydalanuvchi layk bosganini tekshirish
export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => {
    return {
        $lookup: {
            from: 'likes',
            let: {
                localLikeRefId: targetRefId,
                localMemberId: memberId,
                localMyFavorite: true
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$likeRefId', '$$localLikeRefId'] },
                                { $eq: ['$memberId', '$$localMemberId'] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        memberId: 1,
                        likeRefId: 1,
                        myFavorite: '$$localMyFavorite',
                    }
                }
            ],
            as: 'meLiked'
        }
    };
};

// Dacha egasi (Agent) haqida ma'lumotlarni ulash
export const lookupMember = {
    $lookup: {
        from: 'members',
        localField: 'memberId',
        foreignField: '_id',
        as: 'memberData',
    },
};

// Sevimli dachalar ro'yxatida agent ma'lumotlarini ulash
export const lookupFavorite = {
    $lookup: {
        from: 'members',
        localField: 'favoriteProperty.memberId',
        foreignField: '_id',
        as: 'favoriteProperty.memberData',
    },
};

// Oxirgi ko'rilgan dachalar ro'yxatida agent ma'lumotlarini ulash
export const lookupVisited = {
    $lookup: {
        from: 'members',
        localField: 'visitedProperty.memberId',
        foreignField: '_id',
        as: 'visitedProperty.memberData',
    },
};
