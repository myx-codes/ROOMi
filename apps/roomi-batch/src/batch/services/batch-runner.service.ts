import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DEFAULT_LOCK_TTL_MS, isBatchDryRunEnabled } from '../batch.constants';
import { BatchAuditService } from './batch-audit.service';
import { BatchLockService } from './batch-lock.service';

interface BatchRunnerOptions {
  lockTtlMs?: number;
  dryRun?: boolean;
  meta?: Record<string, unknown>;
}

interface BatchRunnerContext {
  runId: string;
  now: Date;
  dryRun: boolean;
}

@Injectable()
export class BatchRunnerService {
  private readonly logger = new Logger(BatchRunnerService.name);

  constructor(
    private readonly batchAuditService: BatchAuditService,
    private readonly batchLockService: BatchLockService,
  ) {}

  public async run(
    jobName: string,
    worker: (context: BatchRunnerContext) => Promise<number>,
    options?: BatchRunnerOptions,
  ): Promise<void> {
    const runId = randomUUID();
    const now = new Date();
    const dryRun = options?.dryRun ?? isBatchDryRunEnabled();
    const lockTtlMs = options?.lockTtlMs ?? DEFAULT_LOCK_TTL_MS;

    const acquired = await this.batchLockService.acquire(jobName, runId, lockTtlMs);
    if (!acquired) {
      await this.batchAuditService.markSkipped(jobName, runId, 'Skipped: lock is held by another worker');
      this.logger.warn(`[${jobName}] skipped: lock is busy`);
      return;
    }

    await this.batchAuditService.start(jobName, runId, {
      dryRun,
      ...(options?.meta ?? {}),
    });

    try {
      const affectedCount = await worker({ runId, now, dryRun });
      const message = dryRun ? 'Dry-run completed' : 'Completed';
      await this.batchAuditService.markSuccess(runId, affectedCount, message);
      this.logger.log(`[${jobName}] success: affectedCount=${affectedCount}, dryRun=${dryRun}`);
    } catch (error) {
      await this.batchAuditService.markFailed(runId, error);
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${jobName}] failed: ${msg}`);
    } finally {
      await this.batchLockService.release(jobName, runId);
    }
  }
}
