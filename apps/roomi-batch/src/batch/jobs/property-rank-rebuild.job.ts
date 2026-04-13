import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { CommentGroup } from '../../../../roomi-api/src/libs/enums/comment.enum';
import { PropertyStatus } from '../../../../roomi-api/src/libs/enums/property.enum';
import { BATCH_TIMEZONE, JOB_NAMES } from '../batch.constants';
import { BatchRunnerService } from '../services/batch-runner.service';

interface RatingSummary {
  _id: Types.ObjectId;
  avgRating: number;
  totalRatings: number;
}

@Injectable()
export class PropertyRankRebuildJob {
  private readonly logger = new Logger(PropertyRankRebuildJob.name);

  constructor(
    @InjectModel('Rating') private readonly ratingModel: Model<any>,
    @InjectModel('Property') private readonly propertyModel: Model<any>,
    private readonly batchRunnerService: BatchRunnerService,
  ) {}

  @Cron('0 3 * * *', { name: JOB_NAMES.PROPERTY_RANK_REBUILD, timeZone: BATCH_TIMEZONE })
  public async rebuildPropertyRanks(): Promise<void> {
    await this.batchRunnerService.run(
      JOB_NAMES.PROPERTY_RANK_REBUILD,
      async ({ dryRun }) => {
        const summaries = await this.ratingModel
          .aggregate<RatingSummary>([
            {
              $match: {
                ratingGroup: CommentGroup.PROPERTY,
              },
            },
            {
              $group: {
                _id: '$ratingRefId',
                avgRating: { $avg: '$ratingValue' },
                totalRatings: { $sum: 1 },
              },
            },
          ])
          .exec();

        const ratedPropertyIds = summaries.map((summary) => summary._id);
        const staleRatedPropertyCount = await this.propertyModel
          .countDocuments({
            propertyStatus: { $ne: PropertyStatus.DELETE },
            propertyRatingCount: { $ne: 0 },
            _id: { $nin: ratedPropertyIds },
          })
          .exec();

        if (dryRun) {
          const candidateCount = summaries.length + staleRatedPropertyCount;
          this.logger.log(`[${JOB_NAMES.PROPERTY_RANK_REBUILD}] dry-run candidateCount=${candidateCount}`);
          return candidateCount;
        }

        let modifiedCount = 0;

        for (const summary of summaries) {
          const propertyRank = Number(summary.avgRating.toFixed(2));
          const result = await this.propertyModel
            .updateOne(
              {
                _id: summary._id,
                propertyStatus: { $ne: PropertyStatus.DELETE },
              },
              {
                $set: {
                  propertyRank,
                  propertyRatingCount: summary.totalRatings,
                },
              },
            )
            .exec();

          modifiedCount += result.modifiedCount;
        }

        const resetResult = await this.propertyModel
          .updateMany(
            {
              propertyStatus: { $ne: PropertyStatus.DELETE },
              propertyRatingCount: { $ne: 0 },
              _id: { $nin: ratedPropertyIds },
            },
            {
              $set: {
                propertyRank: 0,
                propertyRatingCount: 0,
              },
            },
          )
          .exec();

        modifiedCount += resetResult.modifiedCount;
        return modifiedCount;
      },
      {
        meta: {
          cron: '0 3 * * *',
        },
      },
    );
  }
}
