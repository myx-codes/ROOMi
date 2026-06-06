import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PropertyModule } from '../property/property.module';
import { AvailabilityModule } from '../availability/availability.module';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { ChatThreadSchema } from '../../schemas/ChatThread.model';
import { ChatMessageSchema } from '../../schemas/ChatMessage.model';

@Module({
  imports: [
    AuthModule,
    PropertyModule,
    AvailabilityModule,
    MongooseModule.forFeature([
      { name: 'ChatThread', schema: ChatThreadSchema },
      { name: 'ChatMessage', schema: ChatMessageSchema },
    ]),
  ],
  providers: [ChatResolver, ChatService],
})
export class ChatModule {}

