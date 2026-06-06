import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChatThreadStatus } from '../libs/enums/chat.enum';

@Schema({ timestamps: true, collection: 'chatThreads' })
export class ChatThread extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Member',
    default: null,
    index: true,
  })
  memberId?: Types.ObjectId | null;

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  sessionId?: string | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'Property',
    default: null,
    index: true,
  })
  propertyId?: Types.ObjectId | null;

  @Prop({
    type: String,
    required: true,
    default: 'Support conversation',
  })
  title: string;

  @Prop({
    type: String,
    enum: ChatThreadStatus,
    default: ChatThreadStatus.OPEN,
    index: true,
  })
  status: ChatThreadStatus;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  lastMessageAt: Date;
}

export const ChatThreadSchema = SchemaFactory.createForClass(ChatThread);
ChatThreadSchema.index({ memberId: 1, propertyId: 1, status: 1 });
ChatThreadSchema.index({ sessionId: 1, propertyId: 1, status: 1 });

