import { NestFactory } from '@nestjs/core';
import { RoomiBatchModule } from './roomi-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(RoomiBatchModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
