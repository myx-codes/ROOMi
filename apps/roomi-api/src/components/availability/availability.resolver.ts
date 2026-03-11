import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AvailabilityService } from './availability.service';
import { Availability } from '../../libs/dto/availability/availability';
import { AvailabilityInput } from '../../libs/dto/availability/availability.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Types } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class AvailabilityResolver {
    constructor(private readonly availabilityService: AvailabilityService) {}

    // AGENT: Dachani ma'lum kungi holatini o'zgartirish
    @UseGuards(AuthGuard)
    @Mutation(() => Availability, { nullable: true })
    async updateAvailability(
        @Args('input') input: AvailabilityInput,
        @AuthMember('_id') memberId: Types.ObjectId,
    ): Promise<Availability | null> {
        return await this.availabilityService.updateAvailability(memberId, input);
    }

    // HAMMA: Dachaning band kunlari ro'yxatini ko'rish
    @Query(() => [Availability])
    async getPropertyAvailability(
        @Args('propertyId') propertyId: string
    ): Promise<Availability[]> {
        const propertyObjectId = shapeIntoMongoObjectId(propertyId);
        return await this.availabilityService.getPropertyAvailability(propertyObjectId);
    }
}