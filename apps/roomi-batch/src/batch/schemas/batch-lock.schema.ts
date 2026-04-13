import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'batchLocks' })
export class BatchLock {
  @Prop({ required: true, unique: true, index: true })
  lockKey: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop({ required: true })
  lockedAt: Date;

  @Prop({ required: true, index: true })
  lockedUntil: Date;
}

export type BatchLockDocument = HydratedDocument<BatchLock>;
export const BatchLockSchema = SchemaFactory.createForClass(BatchLock);
