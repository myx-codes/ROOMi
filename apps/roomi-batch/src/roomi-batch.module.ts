import { Module } from '@nestjs/common';
import { RoomiBatchController } from './roomi-batch.controller';
import { RoomiBatchService } from './roomi-batch.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [RoomiBatchController],
  providers: [RoomiBatchService],
})
export class RoomiBatchModule {}
