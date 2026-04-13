import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BatchJobAudit, BatchJobAuditStatus } from '../schemas/batch-job-audit.schema';

@Injectable()
export class BatchAuditService {
  private readonly logger = new Logger(BatchAuditService.name);

  constructor(
    @InjectModel('BatchJobAudit')
    private readonly batchJobAuditModel: Model<BatchJobAudit>,
  ) {}

  public async start(jobName: string, runId: string, meta?: Record<string, unknown>): Promise<void> {
    await this.batchJobAuditModel.create({
      jobName,
      runId,
      status: BatchJobAuditStatus.STARTED,
      startedAt: new Date(),
      meta: meta ?? null,
    });
  }

  public async markSkipped(jobName: string, runId: string, message: string): Promise<void> {
    const now = new Date();
    await this.batchJobAuditModel.create({
      jobName,
      runId,
      status: BatchJobAuditStatus.SKIPPED,
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      affectedCount: 0,
      message,
    });
  }

  public async markSuccess(runId: string, affectedCount: number, message?: string): Promise<void> {
    const finishedAt = new Date();
    const current = await this.batchJobAuditModel.findOne({ runId }).lean().exec();
    const startedAt = current?.startedAt ? new Date(current.startedAt) : finishedAt;

    await this.batchJobAuditModel
      .updateOne(
        { runId },
        {
          $set: {
            status: BatchJobAuditStatus.SUCCESS,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            affectedCount,
            message: message ?? null,
          },
        },
      )
      .exec();
  }

  public async markFailed(runId: string, error: unknown): Promise<void> {
    const finishedAt = new Date();
    const current = await this.batchJobAuditModel.findOne({ runId }).lean().exec();
    const startedAt = current?.startedAt ? new Date(current.startedAt) : finishedAt;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    await this.batchJobAuditModel
      .updateOne(
        { runId },
        {
          $set: {
            status: BatchJobAuditStatus.FAILED,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            errorMessage,
            errorStack,
          },
        },
      )
      .exec();

    this.logger.error(`Batch job failed (runId=${runId}): ${errorMessage}`);
  }
}
