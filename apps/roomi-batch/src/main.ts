import { NestFactory } from '@nestjs/core';
import { RoomiBatchModule } from './roomi-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(RoomiBatchModule);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT_BATCH ?? 3000);
}
bootstrap();
