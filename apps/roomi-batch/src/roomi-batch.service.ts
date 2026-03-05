import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomiBatchService {
  getHello(): string {
    return 'ROOMi-batch';
  }
}
