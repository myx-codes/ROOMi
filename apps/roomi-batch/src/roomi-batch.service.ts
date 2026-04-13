import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomiBatchService {
  getHello(): string {
    return 'ROOMi-batch';
  }

  getHealth(): { status: string; uptimeSec: number; now: string } {
    return {
      status: 'ok',
      uptimeSec: Math.floor(process.uptime()),
      now: new Date().toISOString(),
    };
  }
}
