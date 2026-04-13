import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RoomiBatchController } from './roomi-batch.controller';
import { RoomiBatchService } from './roomi-batch.service';
import { BatchJobsModule } from './batch/batch-jobs.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ConfigModule.forRoot(), ScheduleModule.forRoot(), DatabaseModule, BatchJobsModule],
  controllers: [RoomiBatchController],
  providers: [RoomiBatchService],
})
export class RoomiBatchModule {}
