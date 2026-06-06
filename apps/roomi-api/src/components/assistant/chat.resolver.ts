import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Types } from 'mongoose';
import { ChatHistoryInput, ChatThreadInput, SendChatMessageInput } from '../../libs/dto/chat/chat.input';
import { ChatThread, ChatThreadReply } from '../../libs/dto/chat/chat';
import { ChatService } from './chat.service';

@Resolver(() => ChatThread)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(WithoutGuard)
  @Mutation(() => ChatThread)
  public async ensureChatThread(
    @Args('input') input: ChatThreadInput,
    @AuthMember('_id') memberId: Types.ObjectId | null,
  ): Promise<ChatThread> {
    return await this.chatService.ensureThread(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => ChatThread)
  public async getChatThread(
    @Args('input') input: ChatHistoryInput,
    @AuthMember('_id') memberId: Types.ObjectId | null,
  ): Promise<ChatThread> {
    return await this.chatService.getThread(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Mutation(() => ChatThreadReply)
  public async sendChatMessage(
    @Args('input') input: SendChatMessageInput,
    @AuthMember('_id') memberId: Types.ObjectId | null,
  ): Promise<ChatThreadReply> {
    return await this.chatService.sendMessage(memberId, input);
  }
}

