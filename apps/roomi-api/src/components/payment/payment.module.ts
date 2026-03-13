import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';
import { PaymentSchema } from '../../schemas/Payment.model';
import { BookingSchema } from '../../schemas/Booking.model';
import { AuthModule } from '../auth/auth.module';
import { NoticeModule } from '../notifaction/notice.module';
import { PropertyModule } from '../property/property.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Payment', schema: PaymentSchema },
      { name: 'Booking', schema: BookingSchema },
    ]),
    AuthModule,
    NoticeModule,
    PropertyModule,
  ],
  providers: [PaymentResolver, PaymentService]
})
export class PaymentModule {}
