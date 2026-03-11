import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { Model } from 'mongoose';
import { LikeInput } from '../../libs/dto/like/like.input';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class LikeService {
    constructor(@InjectModel('Like') private readonly LikeModel: Model<Like>) {}

    public async togglike(input: LikeInput): Promise<number>{
        const search: T = {memberId: input.memberId, likeRefId: input.likeRefId},
        exist = await this.LikeModel.findOne(search).exec();
        let modifier = 1;

        if(exist) {
            await this.LikeModel.findOneAndDelete(search).exec();
            modifier = -1;
        }else {
            try{
                await this.LikeModel.create(input);
            }catch(err){
                console.log("Error, Service.Model", err.message);
                throw new BadRequestException(Message.CREATE_FAILED)
            }
        }
        console.log(`-Like modifier ${modifier} -`);
        return modifier;
    };



    public async checkLikeExistance(input: LikeInput): Promise<MeLiked[]>{
        const { memberId, likeRefId} = input;
        const result = await this.LikeModel.findOne({memberId: memberId, likeRefId: likeRefId}).exec();
        return result ? [{ memberId: memberId, likeRefId: likeRefId, myFavorite: true}]: [];
    }
}
