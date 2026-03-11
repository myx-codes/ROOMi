import { ObjectId } from 'bson';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common'; // common.ts faylingizdan T turini import qiling

/** --- SORTING CONFIGURATIONS --- **/
export const availableAgentSorts = ["createdAt", "updatedAt", "memberLikes", "memberViews", "memberRank"];
export const availableMemberSorts = ["createdAt", "updatedAt", "memberLikes", "memberViews"];

export const availableOptions = ['propertyBarter', 'propertyRent'];
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
export const availableBookingSorts = ['createdAt', 'bookingStart', 'bookingEnd', 'totalPrice'];

/** --- IMAGE CONFIGURATION --- **/
export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

export const getSerialForImage = (filename: string) => {
    const ext = path.parse(filename).ext;
    return uuidv4() + ext;
};

/** --- DATABASE UTILS --- **/
export const shapeIntoMongoObjectId = (target: any) => {
    return typeof target === 'string' ? new ObjectId(target) : target;
};

/** --- AGGREGATION LOOKUPS (ROOMi Special) --- **/

// 1. Foydalanuvchi ushbu obyektga layk bosganmi? (MeLiked)
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
                        myFavorite: '$$localMyFavorite',
                    }
                }
            ],
            as: 'meLiked'
        }
    };
};

// 2. Foydalanuvchi ushbu Agent/Memberga follow qilganmi? (MeFollowed)
interface LookupAuthMemberFollowed {
    followerId: T;
    followingId: string;
}
export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
    const { followerId,followingId } = input;
    return {
        $lookup: {
            from: 'follows',
            let: {
                localFollowerId: followerId,
                localFollowingId: shapeIntoMongoObjectId(followingId),
                localMyFavorite: true
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$followerId', '$$localFollowerId'] }, 
                                { $eq: ['$followingId', '$$localFollowingId'] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        myFollowing: '$$localMyFavorite',
                    }
                }
            ],
            as: 'meFollowed'
        }
    };
};

// 3. Obyekt egasining ma'lumotlarini qo'shish (Owner Data)
export const lookupMember = {
    $lookup: {
        from: 'members',
        localField: 'memberId',
        foreignField: '_id',
        as: 'memberData',
    },
};

// 4. Following va Follower ma'lumotlari
export const lookupFollowingData = {
    $lookup: {
        from: 'members',
        localField: 'followingId',
        foreignField: '_id',
        as: 'followingData',
    },
};

export const lookupFollowerData = {
    $lookup: {
        from: 'members',
        localField: 'followerId',
        foreignField: '_id',
        as: 'followerData',
    },
};

// 5. ROOMi Maxsus: Property uchun unga tegishli Availability (bandlik taqvimi)
export const lookupPropertyAvailability = {
    $lookup: {
        from: 'availabilities',
        localField: '_id',
        foreignField: 'propertyId',
        as: 'availabilityData',
    },
};

// 6. ROOMi Maxsus: Property uchun unga tegishli oxirgi Review (Comment)lar
export const lookupLatestComments = {
    $lookup: {
        from: 'comments',
        let: { localPropertyId: '$_id' },
        pipeline: [
            { $match: { $expr: { $eq: ['$commentRefId', '$$localPropertyId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 3 }
        ],
        as: 'latestComments'
    }
};