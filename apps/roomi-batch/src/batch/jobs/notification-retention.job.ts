import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { NoticeStatus } from '../../../../roomi-api/src/libs/enums/notification.enum';
import {
  BATCH_TIMEZONE,
  DEFAULT_READ_NOTICE_RETENTION_DAYS,
  JOB_NAMES,
} from '../batch.constants';
import { BatchRunnerService } from '../services/batch-runner.service';

@Injectable()
export class NotificationRetentionJob {
  private readonly logger = new Logger(NotificationRetentionJob.name);

  constructor(
    @InjectModel('Notice') private readonly noticeModel: Model<any>,
    private readonly batchRunnerService: BatchRunnerService,
  ) {}

  @Cron('20 1 * * *', { name: JOB_NAMES.NOTICE_RETENTION, timeZone: BATCH_TIMEZONE })
  public async cleanupReadNotifications(): Promise<void> {
    await this.batchRunnerService.run(
      JOB_NAMES.NOTICE_RETENTION,
      async ({ now, dryRun }) => {
        const cutoff = new Date(now.getTime() - DEFAULT_READ_NOTICE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        const search = {
          status: NoticeStatus.READ,
          createdAt: { $lte: cutoff },
        };

        const candidateCount = await this.noticeModel.countDocuments(search).exec();
        if (candidateCount === 0) return 0;
        if (dryRun) {
          this.logger.log(`[${JOB_NAMES.NOTICE_RETENTION}] dry-run candidateCount=${candidateCount}`);
          return candidateCount;
        }

        const result = await this.noticeModel
          .updateMany(search, {
            $set: {
              status: NoticeStatus.DELETE,
            },
          })
          .exec();

        return result.modifiedCount;
      },
      {
        meta: {
          cron: '20 1 * * *',
          retentionDays: DEFAULT_READ_NOTICE_RETENTION_DAYS,
        },
      },
    );
  }
}
