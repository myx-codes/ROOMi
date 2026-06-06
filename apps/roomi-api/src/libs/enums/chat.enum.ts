import { registerEnumType } from '@nestjs/graphql';

export enum ChatThreadStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

registerEnumType(ChatThreadStatus, {
  name: 'ChatThreadStatus',
});

export enum ChatSenderType {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

registerEnumType(ChatSenderType, {
  name: 'ChatSenderType',
});
