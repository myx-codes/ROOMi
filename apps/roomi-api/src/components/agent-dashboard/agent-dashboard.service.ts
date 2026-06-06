import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentDashboardBookingItem, AgentDashboardOverview, AgentDashboardPropertyItem } from '../../libs/dto/agent-dashboard/agent-dashboard';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { PropertyStatus } from '../../libs/enums/property.enum';

@Injectable()
export class AgentDashboardService {
  constructor(
    @InjectModel('Property') private readonly propertyModel: Model<any>,
    @InjectModel('Booking') private readonly bookingModel: Model<any>,
  ) {}

  public async getOverview(agentId: Types.ObjectId): Promise<AgentDashboardOverview> {
    try {
      const agentObjectId = new Types.ObjectId(agentId);
      const now = new Date();
      const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      const properties = (await this.propertyModel
        .find({
          memberId: agentObjectId,
          propertyStatus: { $ne: PropertyStatus.DELETE },
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec()) as Array<{
        _id: Types.ObjectId;
        propertyTitle: string;
        propertyType: string;
        propertyStatus: PropertyStatus;
        propertyPrice: number;
        propertyViews: number;
        propertyLikes: number;
        dynamicPricingEnabled?: boolean;
        createdAt: Date;
      }>;

      const propertyIds = properties.map((item) => new Types.ObjectId(item._id));
      const propertyIdStrings = new Set(propertyIds.map((id) => String(id)));

      const bookingStats = {
        totalBookings: 0,
        confirmedBookings: 0,
        waitingBookings: 0,
        cancelledBookings: 0,
        finishedBookings: 0,
        upcomingBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0,
      };

      let recentBookings: AgentDashboardBookingItem[] = [];

      if (propertyIds.length > 0) {
        const bookings = await this.bookingModel
          .aggregate([
            {
              $addFields: {
                propertyIdObj: {
                  $convert: {
                    input: '$propertyId',
                    to: 'objectId',
                    onError: null,
                    onNull: null,
                  },
                },
              },
            },
            {
              $match: {
                propertyIdObj: { $in: propertyIds },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $facet: {
                stats: [
                  {
                    $group: {
                      _id: null,
                      totalBookings: { $sum: 1 },
                      confirmedBookings: {
                        $sum: {
                          $cond: [{ $eq: ['$bookingStatus', BookingStatus.CONFIRMED] }, 1, 0],
                        },
                      },
                      waitingBookings: {
                        $sum: {
                          $cond: [{ $eq: ['$bookingStatus', BookingStatus.WAITING] }, 1, 0],
                        },
                      },
                      cancelledBookings: {
                        $sum: {
                          $cond: [{ $eq: ['$bookingStatus', BookingStatus.CANCELLED] }, 1, 0],
                        },
                      },
                      finishedBookings: {
                        $sum: {
                          $cond: [{ $eq: ['$bookingStatus', BookingStatus.FINISHED] }, 1, 0],
                        },
                      },
                      upcomingBookings: {
                        $sum: {
                          $cond: [{ $gte: ['$bookingStart', startOfToday] }, 1, 0],
                        },
                      },
                      totalRevenue: {
                        $sum: {
                          $cond: [
                            {
                              $in: ['$bookingStatus', [BookingStatus.CONFIRMED, BookingStatus.FINISHED]],
                            },
                            { $ifNull: ['$totalPrice', 0] },
                            0,
                          ],
                        },
                      },
                    },
                  },
                ],
                recent: [
                  { $limit: 6 },
                  {
                    $lookup: {
                      from: 'properties',
                      localField: 'propertyIdObj',
                      foreignField: '_id',
                      as: 'propertyData',
                    },
                  },
                  { $unwind: { path: '$propertyData', preserveNullAndEmptyArrays: true } },
                  {
                    $addFields: {
                      memberIdObj: {
                        $convert: {
                          input: '$memberId',
                          to: 'objectId',
                          onError: null,
                          onNull: null,
                        },
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'members',
                      localField: 'memberIdObj',
                      foreignField: '_id',
                      as: 'memberData',
                    },
                  },
                  { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
                  {
                    $project: {
                      _id: 1,
                      bookingStatus: 1,
                      bookingStart: 1,
                      bookingEnd: 1,
                      totalPrice: { $ifNull: ['$totalPrice', 0] },
                      bookingGuests: { $ifNull: ['$bookingGuests', 0] },
                      createdAt: 1,
                      propertyTitle: '$propertyData.propertyTitle',
                      memberNick: '$memberData.memberNick',
                    },
                  },
                ],
              },
            },
          ])
          .exec();

        const stats = bookings[0]?.stats?.[0];
        if (stats) {
          bookingStats.totalBookings = stats.totalBookings ?? 0;
          bookingStats.confirmedBookings = stats.confirmedBookings ?? 0;
          bookingStats.waitingBookings = stats.waitingBookings ?? 0;
          bookingStats.cancelledBookings = stats.cancelledBookings ?? 0;
          bookingStats.finishedBookings = stats.finishedBookings ?? 0;
          bookingStats.upcomingBookings = stats.upcomingBookings ?? 0;
          bookingStats.totalRevenue = stats.totalRevenue ?? 0;
          bookingStats.averageBookingValue = bookingStats.totalBookings
            ? Math.round(bookingStats.totalRevenue / Math.max(bookingStats.totalBookings, 1))
            : 0;
        }

        recentBookings = (bookings[0]?.recent ?? []) as AgentDashboardBookingItem[];
      }

      const propertyStats = {
        totalProperties: properties.length,
        activeProperties: properties.filter((item) => item.propertyStatus === PropertyStatus.ACTIVE).length,
        holdProperties: properties.filter((item) => item.propertyStatus === PropertyStatus.HOLD).length,
        bookedProperties: properties.filter((item) => item.propertyStatus === PropertyStatus.BOOKED).length,
        dynamicPricingProperties: properties.filter((item) => item.dynamicPricingEnabled !== false).length,
        averagePropertyPrice: properties.length
          ? Math.round(properties.reduce((sum, item) => sum + Number(item.propertyPrice ?? 0), 0) / properties.length)
          : 0,
        totalPropertyViews: properties.reduce((sum, item) => sum + Number(item.propertyViews ?? 0), 0),
        totalPropertyLikes: properties.reduce((sum, item) => sum + Number(item.propertyLikes ?? 0), 0),
      };

      const recentProperties: AgentDashboardPropertyItem[] = properties.slice(0, 6).map((item) => ({
        _id: item._id,
        propertyTitle: item.propertyTitle,
        propertyType: item.propertyType as any,
        propertyStatus: item.propertyStatus,
        propertyPrice: Number(item.propertyPrice ?? 0),
        propertyViews: Number(item.propertyViews ?? 0),
        propertyLikes: Number(item.propertyLikes ?? 0),
        dynamicPricingEnabled: item.dynamicPricingEnabled !== false,
        createdAt: item.createdAt,
      }));

      return {
        propertyStats,
        bookingStats,
        recentProperties,
        recentBookings,
      };
    } catch (error) {
      console.error('[agent-dashboard] overview_failed', error);
      throw new InternalServerErrorException('Failed to load agent dashboard overview');
    }
  }
}
