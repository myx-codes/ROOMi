import { Module } from '@nestjs/common';
import { RoomiBatchController } from './roomi-batch.controller';
import { RoomiBatchService } from './roomi-batch.service';

@Module({
  imports: [],
  controllers: [RoomiBatchController],
  providers: [RoomiBatchService],
})
export class RoomiBatchModule {}
