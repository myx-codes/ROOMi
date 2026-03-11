import { Module } from '@nestjs/common';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';
import { MongooseModule } from '@nestjs/mongoose';
import MemberScheme from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Member", schema: MemberScheme }]),
    AuthModule
  ],
  providers: [
    MemberResolver, 
    MemberService]
})
export class MemberModule {}
