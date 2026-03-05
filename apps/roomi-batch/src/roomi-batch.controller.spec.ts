import { Test, TestingModule } from '@nestjs/testing';
import { RoomiBatchController } from './roomi-batch.controller';
import { RoomiBatchService } from './roomi-batch.service';

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
    it('should return "Hello World!"', () => {
      expect(roomiBatchController.getHello()).toBe('Hello World!');
    });
  });
});
