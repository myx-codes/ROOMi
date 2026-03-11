import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';
import {BookingSchema} from '../../schemas/Booking.model';
import { AuthModule } from '../auth/auth.module';
import { PropertyModule } from '../property/property.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Booking', schema: BookingSchema }]),
    AuthModule,
    PropertyModule,
    AvailabilityModule, // Bron qilinganda sanalarni yopish uchun kerak
  ],
  providers: [BookingResolver, BookingService],
  exports: [BookingService],
})
export class BookingModule {}