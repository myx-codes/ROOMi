import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; // ObjectId ni shu yerdan olish ishonchliroq
import { Properties, Property } from '../../libs/dto/property/property';
import { AgentPropertiesInquiry, AllPropertiesInquiry, OrdinaryInquiry, PropertiesInquiry, PropertyInput } from '../../libs/dto/property/property.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { StatisticModify, T } from '../../libs/types/common';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import moment from 'moment';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';

@Injectable()
export class PropertyService {

    constructor(
        @InjectModel("Property") private readonly propertyModel: Model<Property>,
        private readonly memberService: MemberService,
        private readonly viewService: ViewService,
        private readonly likeService: LikeService,
    ) {}

    public async createProperty(input: PropertyInput): Promise<Property> {
        try {
            const result = await this.propertyModel.create(input);
            
            // increase memberProperties
            await this.memberService.memberStatsEditor({
                _id: result.memberId,
                targetKey: "memberProperties", 
                modifier: 1,
            });

            return result;
        } catch (err) {
            console.log("Error, Service.Model", err.message);
            throw new BadRequestException(Message.CREATE_FAILED);
        }
    };

    public async getProperty(memberId: Types.ObjectId, propertyId: Types.ObjectId): Promise<Property> {
        const search: T = {
            _id: propertyId,
            propertyStatus: PropertyStatus.ACTIVE,
        };

        // 1-TUZATISH: .lean() dan keyin 'as Property' qo'shildi, chunki natija null bo'lishi mumkin
        const targetProperty: Property = await this.propertyModel.findOne(search).lean().exec() as Property;
        
        if (!targetProperty) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        if (memberId) {
            const viewInput = { memberId: memberId, viewRefId: propertyId, viewGroup: ViewGroup.PROPERTY };
            const newView = await this.viewService.recordView(viewInput);
            if (newView) {
                await this.propertyStatsEditor({ _id: propertyId, targetKey: 'propertyViews', modifier: 1 });
                targetProperty.propertyViews++;
            }
        }

        // MeLiked
        const likeInput = { memberId: memberId, likeRefId: propertyId, likeGroup: LikeGroup.PROPERTY};
        targetProperty.meLiked = await this.likeService.checkLikeExistance(likeInput);
        targetProperty.memberData = await this.memberService.getMember(null as any, targetProperty.memberId);
        
        return targetProperty;
    }

    /** Biror property ning bir kecha narxini olish (bron totalPrice hisoblash uchun) */
    public async getPropertyPrice(propertyId: Types.ObjectId): Promise<number> {
        const doc = await this.propertyModel
            .findById(propertyId)
            .select('propertyPrice')
            .lean()
            .exec();
        if (!doc || (doc as any).propertyPrice == null) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return (doc as any).propertyPrice;
    }

    
    public async updateProperty(memberId: Types.ObjectId, input: PropertyUpdate): Promise<Property> {
        let { propertyStatus, deletedAt } = input;
        const search: T = {
            _id: input._id,
            memberId: memberId,
            propertyStatus: PropertyStatus.ACTIVE,
        };
        
      
        if (propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();
        
        const result = await this.propertyModel
        .findOneAndUpdate(search, input, {
            new: true,
        })
        .exec();
        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        
       
            if (deletedAt) {
                await this.memberService.memberStatsEditor({
                    _id: memberId,
                    targetKey: 'memberProperties',
                    modifier: -1,
                });
            }
            
            return result;
        };
        
        
        public async getProperties(memberId: Types.ObjectId, input: PropertiesInquiry): Promise<Properties> {
            const match: T = { propertyStatus: PropertyStatus.ACTIVE };
            const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
            
            this.shapeMatchQuery(match, input);
            console.log('match:', match);
            
            const result = await this.propertyModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            lookupAuthMemberLiked(memberId),
                            lookupMember,
                            { $unwind: '$memberData' },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();
            if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
            
            return result[0];
        };
        
        private shapeMatchQuery(match: T, input: PropertiesInquiry): void {
            const {
                memberId,
                locationList,
                roomsList,
                bedsList,
                typeList,
                periodsRange,
                pricesRange,
                squaresRange,
                options,
                text,
            } = input.search;
            
            if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
            if (locationList) match.propertyLocation = { $in: locationList };
            if (roomsList) match.propertyRooms = { $in: roomsList };
            if (bedsList) match.propertyBeds = { $in: bedsList };
            if (typeList) match.propertyType = { $in: typeList };
            
            if (pricesRange) match.propertyPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
            if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
            if (squaresRange) match.propertySquare = { $gte: squaresRange.start, $lte: squaresRange.end };
            
            if (text) match.propertyTitle = { $regex: new RegExp(text, 'i') };
            if (options) {
                match['$or'] = options.map((ele) => {
                    return { [ele]: true };
                });
            }
        };
        
        
        public async getAgentProperties(memberId: Types.ObjectId, input: AgentPropertiesInquiry): Promise<Properties> {
            const { propertyStatus } = input.search;
            if (propertyStatus === PropertyStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
            
            const match: T = {
                memberId: memberId,
                propertyStatus: propertyStatus ?? { $ne: PropertyStatus.DELETE },
            };
            const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
            
            const result = await this.propertyModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            lookupMember,
                            { $unwind: '$memberData' },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();
            if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
            
            return result[0];
        };
        
        
        
        public async getAllPropertiesByAdmin(input: AllPropertiesInquiry): Promise<Properties> {
            const { propertyStatus, propertyLocationList } = input.search;
            const match: T = {};
            const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
            
            if (propertyStatus) match.propertyStatus = propertyStatus;
            if (propertyLocationList) match.propertyLocation = { $in: propertyLocationList };
            
            const result = await this.propertyModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            lookupMember,
                            { $unwind: '$memberData' },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();
            if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
            
            return result[0];
        };
        
        
        
        public async updatePropertyByAdmin(input: PropertyUpdate): Promise<Property> {
            let { propertyStatus, deletedAt } = input;
            const search: T = {
                _id: input._id,
                propertyStatus: PropertyStatus.ACTIVE,
            };
            
            
            if (propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();
            
            const result = await this.propertyModel
            .findOneAndUpdate(search, input, {
                new: true,
            })
            .exec();
            if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
            
            if (deletedAt) {
                await this.memberService.memberStatsEditor({
                    _id: result.memberId,
                    targetKey: 'memberProperties',
                    modifier: -1,
                });
            }
            
            return result;
        };
        
        
        
        public async removePropertyByAdmin(propertyId: Types.ObjectId): Promise<Property> {
            const search: T = { _id: propertyId, propertyStatus: PropertyStatus.DELETE };
            const result = await this.propertyModel.findOneAndDelete(search).exec();
            if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
            
            return result;
        };
        
        
        
        
        
        public async propertyStatsEditor(input: StatisticModify): Promise<Property> {
            const { _id, targetKey, modifier } = input;
            return await this.propertyModel
                .findByIdAndUpdate(
                    _id,
                    { $inc: { [targetKey]: modifier } },
                    { new: true }
                )
                .exec() as Property; // 3-TUZATISH: Qaytuvchi qiymatni majburlab 'Property' deb belgilaymiz
        };


        public async getFavorites(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Properties>{
            return await this.likeService.getFavoriteProperties(memberId, input);
        };


        public async getVisited(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Properties>{
            return await this.viewService.getVisitedProperties(memberId, input);
        }
        
        
        
    }
    
    
    
    
    
    