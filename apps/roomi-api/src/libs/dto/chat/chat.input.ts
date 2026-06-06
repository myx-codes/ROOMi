import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { Types } from 'mongoose';

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;
const LANGUAGE_PATTERN = /^(en|ko|uz)$/;

@InputType()
export class ChatThreadInput {
  @IsOptional()
  @Field(() => ID, { nullable: true })
  threadId?: Types.ObjectId;

  @IsOptional()
  @Field(() => ID, { nullable: true })
  propertyId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @Matches(SESSION_PATTERN, {
    message: 'sessionId faqat 8-128 ta harf, raqam, _ va - belgilaridan iborat bo‘lishi mumkin',
  })
  @Field(() => String, { nullable: true })
  sessionId?: string;

  @IsOptional()
  @Length(2, 120)
  @Field(() => String, { nullable: true })
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(LANGUAGE_PATTERN, {
    message: 'language en, ko yoki uz bo‘lishi kerak',
  })
  @Field(() => String, { nullable: true })
  language?: string;
}

@InputType()
export class SendChatMessageInput {
  @IsOptional()
  @Field(() => ID, { nullable: true })
  threadId?: Types.ObjectId;

  @IsOptional()
  @Field(() => ID, { nullable: true })
  propertyId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @Matches(SESSION_PATTERN, {
    message: 'sessionId faqat 8-128 ta harf, raqam, _ va - belgilaridan iborat bo‘lishi mumkin',
  })
  @Field(() => String, { nullable: true })
  sessionId?: string;

  @IsNotEmpty()
  @Length(1, 2000)
  @Field(() => String)
  message: string;

  @IsOptional()
  @IsString()
  @Matches(LANGUAGE_PATTERN, {
    message: 'language en, ko yoki uz bo‘lishi kerak',
  })
  @Field(() => String, { nullable: true })
  language?: string;
}

@InputType()
export class ChatHistoryInput {
  @IsOptional()
  @Field(() => ID, { nullable: true })
  threadId?: Types.ObjectId;

  @IsOptional()
  @Field(() => ID, { nullable: true })
  propertyId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @Matches(SESSION_PATTERN, {
    message: 'sessionId faqat 8-128 ta harf, raqam, _ va - belgilaridan iborat bo‘lishi mumkin',
  })
  @Field(() => String, { nullable: true })
  sessionId?: string;

  @IsOptional()
  @IsString()
  @Matches(LANGUAGE_PATTERN, {
    message: 'language en, ko yoki uz bo‘lishi kerak',
  })
  @Field(() => String, { nullable: true })
  language?: string;
}
