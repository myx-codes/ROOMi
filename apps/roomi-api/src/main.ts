import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from '../src/libs/interceptor/Logging.interceptor';
import {graphqlUploadExpress} from "graphql-upload"
import * as express from "express"
import { WsAdapter } from '@nestjs/platform-ws';
import cookieParser from 'cookie-parser';
import { CSRF_HEADER_NAME } from './components/auth/auth-cookie.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      CSRF_HEADER_NAME,
      'x-xsrf-token',
      'apollo-require-preflight',
      'x-apollo-operation-name',
    ],
    exposedHeaders: [CSRF_HEADER_NAME],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  })
  app.use(cookieParser())

  app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }))
  app.use("/uploads", express.static('./uploads'))

  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(process.env.PORT_API ?? 3000);
  console.log('ROOMI-API PORT:', process.env.PORT_API);

  
}
bootstrap();
