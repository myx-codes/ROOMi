import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability } from '../../libs/dto/availability/availability';
import { AvailabilityInput } from '../../libs/dto/availability/availability.input';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class AvailabilityService {
    constructor(
        @InjectModel('Availability') private readonly availabilityModel: Model<Availability>,
    ) {}

    // Agent o'z dachasini ma'lum kunlarini yopishi yoki ochishi uchun
    public async updateAvailability(memberId: Types.ObjectId, input: AvailabilityInput): Promise<Availability | null> {
        const { propertyId, date, isBooked } = input;

        try {
            // Agar isBooked true bo'lsa - yaratamiz yoki yangilaymiz, false bo'lsa - o'chiramiz (ochib yuboramiz)
            if (isBooked) {
                return await this.availabilityModel.findOneAndUpdate(
                    { propertyId, date },
                    { propertyId, date, memberId, isBooked },
                    { upsert: true, new: true },
                ).exec();
            } else {
                await this.availabilityModel.findOneAndDelete({ propertyId, date }).exec();
                return null;
            }
        } catch (err) {
            throw new InternalServerErrorException(Message.UPDATE_FAILED);
        }
    }

    // Dachaning band kunlarini olish
    public async getPropertyAvailability(propertyId: Types.ObjectId): Promise<Availability[]> {
        const today = new Date().toISOString().split('T')[0]; // Faqat bugundan keyingi kunlarni olamiz
        return await this.availabilityModel
            .find({
                propertyId,
                date: { $gte: today }
            })
            .sort({ date: 1 })
            .exec();
    }
}