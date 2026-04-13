import { Controller, Get } from '@nestjs/common';
import { RoomiBatchService } from './roomi-batch.service';

@Controller()
export class RoomiBatchController {
  constructor(private readonly roomiBatchService: RoomiBatchService) {}

  @Get()
  getHello(): string {
    return this.roomiBatchService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; uptimeSec: number; now: string } {
    return this.roomiBatchService.getHealth();
  }
}
