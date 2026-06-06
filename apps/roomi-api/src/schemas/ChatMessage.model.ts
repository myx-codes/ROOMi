import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChatSenderType } from '../libs/enums/chat.enum';

@Schema({ timestamps: true, collection: 'chatMessages' })
export class ChatMessage extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'ChatThread',
    required: true,
    index: true,
  })
  threadId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ChatSenderType,
    required: true,
    index: true,
  })
  senderType: ChatSenderType;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  content: string;

  @Prop({
    type: Object,
    default: null,
  })
  metadata?: Record<string, unknown> | null;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ threadId: 1, createdAt: 1 });

