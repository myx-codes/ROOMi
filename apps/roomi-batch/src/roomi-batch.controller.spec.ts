import { Test, TestingModule } from '@nestjs/testing';
import { RoomiBatchController } from './roomi-batch.controller';
import { RoomiBatchService } from './roomi-batch.service';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('RoomiBatchController', () => {
  let roomiBatchController: RoomiBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RoomiBatchController],
      providers: [RoomiBatchService],
    }).compile();

    roomiBatchController = app.get<RoomiBatchController>(RoomiBatchController);
  });

  describe('root', () => {
    it('should return "ROOMi-batch"', () => {
      expect(roomiBatchController.getHello()).toBe('ROOMi-batch');
    });
  });
});

