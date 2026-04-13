import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum BatchJobAuditStatus {
  STARTED = 'STARTED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

@Schema({ timestamps: true, collection: 'batchJobAudits' })
export class BatchJobAudit {
  @Prop({ required: true, index: true })
  jobName: string;

  @Prop({ required: true, unique: true, index: true })
  runId: string;

  @Prop({ required: true, enum: BatchJobAuditStatus, index: true })
  status: BatchJobAuditStatus;

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  finishedAt?: Date;

  @Prop({ default: 0 })
  durationMs?: number;

  @Prop({ default: 0 })
  affectedCount?: number;

  @Prop()
  message?: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  errorStack?: string;

  @Prop({ type: Object, default: null })
  meta?: Record<string, unknown> | null;
}

export type BatchJobAuditDocument = HydratedDocument<BatchJobAudit>;
export const BatchJobAuditSchema = SchemaFactory.createForClass(BatchJobAudit);

BatchJobAuditSchema.index({ jobName: 1, startedAt: -1 });
