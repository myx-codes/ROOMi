import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import PropertySchema from '../../schemas/Property.model';
import { BookingSchema } from '../../schemas/Booking.model';
import { AgentDashboardResolver } from './agent-dashboard.resolver';
import { AgentDashboardService } from './agent-dashboard.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Property', schema: PropertySchema },
      { name: 'Booking', schema: BookingSchema },
    ]),
  ],
  providers: [AgentDashboardResolver, AgentDashboardService],
  exports: [AgentDashboardService],
})
export class AgentDashboardModule {}
