import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { BookingStatus } from '../../../../roomi-api/src/libs/enums/booking.enum';
import {
  BATCH_TIMEZONE,
  DEFAULT_WAITING_BOOKING_TTL_HOURS,
  JOB_NAMES,
} from '../batch.constants';
import { BatchRunnerService } from '../services/batch-runner.service';

@Injectable()
export class BookingLifecycleJob {
  private readonly logger = new Logger(BookingLifecycleJob.name);

  constructor(
    @InjectModel('Booking') private readonly bookingModel: Model<any>,
    private readonly batchRunnerService: BatchRunnerService,
  ) {}

  @Cron('5 0 * * *', { name: JOB_NAMES.BOOKING_AUTO_FINISH, timeZone: BATCH_TIMEZONE })
  public async autoFinishConfirmedBookings(): Promise<void> {
    await this.batchRunnerService.run(
      JOB_NAMES.BOOKING_AUTO_FINISH,
      async ({ now, dryRun }) => {
        const search = {
          bookingStatus: BookingStatus.CONFIRMED,
          bookingEnd: { $lt: now },
        };

        const candidateCount = await this.bookingModel.countDocuments(search).exec();
        if (candidateCount === 0) return 0;
        if (dryRun) {
          this.logger.log(
            `[${JOB_NAMES.BOOKING_AUTO_FINISH}] dry-run candidateCount=${candidateCount}`,
          );
          return candidateCount;
        }

        const result = await this.bookingModel
          .updateMany(search, {
            $set: {
              bookingStatus: BookingStatus.FINISHED,
            },
          })
          .exec();

        return result.modifiedCount;
      },
      {
        meta: {
          cron: '5 0 * * *',
        },
      },
    );
  }

  @Cron('15 * * * *', { name: JOB_NAMES.BOOKING_CANCEL_STALE_WAITING, timeZone: BATCH_TIMEZONE })
  public async cancelStaleWaitingBookings(): Promise<void> {
    await this.batchRunnerService.run(
      JOB_NAMES.BOOKING_CANCEL_STALE_WAITING,
      async ({ now, dryRun }) => {
        const cutoff = new Date(now.getTime() - DEFAULT_WAITING_BOOKING_TTL_HOURS * 60 * 60 * 1000);
        const search = {
          bookingStatus: BookingStatus.WAITING,
          createdAt: { $lte: cutoff },
        };

        const candidateCount = await this.bookingModel.countDocuments(search).exec();
        if (candidateCount === 0) return 0;
        if (dryRun) {
          this.logger.log(
            `[${JOB_NAMES.BOOKING_CANCEL_STALE_WAITING}] dry-run candidateCount=${candidateCount}`,
          );
          return candidateCount;
        }

        const result = await this.bookingModel
          .updateMany(search, {
            $set: {
              bookingStatus: BookingStatus.CANCELLED,
            },
          })
          .exec();

        return result.modifiedCount;
      },
      {
        meta: {
          cron: '15 * * * *',
          waitingTtlHours: DEFAULT_WAITING_BOOKING_TTL_HOURS,
        },
      },
    );
  }
}
