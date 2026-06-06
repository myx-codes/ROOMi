import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { BookingStatus } from '../../enums/booking.enum';
import { PropertyStatus, PropertyType } from '../../enums/property.enum';

@ObjectType()
export class AgentDashboardPropertyItem {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => String)
  propertyTitle: string;

  @Field(() => PropertyType)
  propertyType: PropertyType;

  @Field(() => PropertyStatus)
  propertyStatus: PropertyStatus;

  @Field(() => Float)
  propertyPrice: number;

  @Field(() => Int)
  propertyViews: number;

  @Field(() => Int)
  propertyLikes: number;

  @Field(() => Boolean)
  dynamicPricingEnabled: boolean;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class AgentDashboardBookingItem {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => BookingStatus)
  bookingStatus: BookingStatus;

  @Field(() => Date)
  bookingStart: Date;

  @Field(() => Date)
  bookingEnd: Date;

  @Field(() => Int)
  totalPrice: number;

  @Field(() => Int)
  bookingGuests: number;

  @Field(() => String, { nullable: true })
  propertyTitle?: string;

  @Field(() => String, { nullable: true })
  memberNick?: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class AgentDashboardPropertyStats {
  @Field(() => Int)
  totalProperties: number;

  @Field(() => Int)
  activeProperties: number;

  @Field(() => Int)
  holdProperties: number;

  @Field(() => Int)
  bookedProperties: number;

  @Field(() => Int)
  dynamicPricingProperties: number;

  @Field(() => Float)
  averagePropertyPrice: number;

  @Field(() => Int)
  totalPropertyViews: number;

  @Field(() => Int)
  totalPropertyLikes: number;
}

@ObjectType()
export class AgentDashboardBookingStats {
  @Field(() => Int)
  totalBookings: number;

  @Field(() => Int)
  confirmedBookings: number;

  @Field(() => Int)
  waitingBookings: number;

  @Field(() => Int)
  cancelledBookings: number;

  @Field(() => Int)
  finishedBookings: number;

  @Field(() => Int)
  upcomingBookings: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  averageBookingValue: number;
}

@ObjectType()
export class AgentDashboardOverview {
  @Field(() => AgentDashboardPropertyStats)
  propertyStats: AgentDashboardPropertyStats;

  @Field(() => AgentDashboardBookingStats)
  bookingStats: AgentDashboardBookingStats;

  @Field(() => [AgentDashboardPropertyItem])
  recentProperties: AgentDashboardPropertyItem[];

  @Field(() => [AgentDashboardBookingItem])
  recentBookings: AgentDashboardBookingItem[];
}
