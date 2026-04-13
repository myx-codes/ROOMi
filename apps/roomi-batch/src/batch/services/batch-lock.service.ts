import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BatchLock } from '../schemas/batch-lock.schema';

@Injectable()
export class BatchLockService {
  constructor(
    @InjectModel('BatchLock')
    private readonly batchLockModel: Model<BatchLock>,
  ) {}

  public async acquire(lockKey: string, ownerId: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + ttlMs);

    try {
      const result = await this.batchLockModel
        .updateOne(
          {
            lockKey,
            $or: [{ lockedUntil: { $lte: now } }, { ownerId }],
          },
          {
            $setOnInsert: { lockKey },
            $set: { ownerId, lockedAt: now, lockedUntil },
          },
          { upsert: true },
        )
        .exec();

      return result.modifiedCount > 0 || result.upsertedCount > 0;
    } catch (error: any) {
      if (error?.code === 11000) return false;
      throw error;
    }
  }

  public async release(lockKey: string, ownerId: string): Promise<void> {
    await this.batchLockModel
      .updateOne(
        { lockKey, ownerId },
        {
          $set: {
            lockedUntil: new Date(0),
          },
        },
      )
      .exec();
  }
}
