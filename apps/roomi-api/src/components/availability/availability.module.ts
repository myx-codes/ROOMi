import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvailabilityResolver } from './availability.resolver';
import { AvailabilityService } from './availability.service';
import { AvailabilitySchema } from '../../schemas/Availability.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // 1. Availability modelini MongoDB collection sifatida ulash
    MongooseModule.forFeature([
      { name: 'Availability', schema: AvailabilitySchema }, // Schema nomini o'zgartiring
    ]),
    AuthModule
  ],
  providers: [
    AvailabilityResolver, 
    AvailabilityService
  ],
  // 2. Agar boshqa modullar (masalan, Property yoki Booking) 
  // availability mantiqidan foydalansa, uni export qilish shart
  exports: [AvailabilityService], 
})
export class AvailabilityModule {}