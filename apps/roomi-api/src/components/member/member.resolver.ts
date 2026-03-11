import { Mutation, Resolver, Query, Args } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { InternalServerErrorException, UseGuards} from '@nestjs/common';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { Member, Members } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';

@Resolver()
export class MemberResolver {
    constructor( private readonly memberService: MemberService) {}

    @Mutation(() => Member)
    public async signup(@Args("input") input: MemberInput): Promise<Member>{
        console.log("Mutation: signup")
        return await this.memberService.signup(input);
       
    };

    @Mutation(() => Member)
    public async login(@Args("input") input: LoginInput): Promise<Member>{
        console.log("Mutation: login")
        return await this.memberService.login(input);
    };


    // Authenticated APIs 
    @UseGuards(AuthGuard)
    @Mutation(() => Member)
    public async updateMember(
        @Args("input") input: MemberUpdate,
        @AuthMember('_id') memberId: ObjectId): Promise<Member>{
        console.log("Mutation: updateMember");
        delete (input as any)._id;
        return await this.memberService.updateMember(memberId, input);
    };

    @UseGuards(AuthGuard)
    @Query(() => String)
    public async checkAuth(@AuthMember("memberNick") memberNick: string): Promise<string>{
        console.log("Query: checkAuth")
        console.log("memberNick", memberNick)
        return await `Hi ${memberNick};`;
    };

    @Roles(MemberType.USER, MemberType.AGENT)
    @UseGuards(RolesGuard)
    @Query(() => String)
    public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string>{
        console.log("Query: checkAuthRoles")
        return await `Hi ${authMember.memberNick}, you are a ${authMember.memberType} (memberId: ${authMember._id})`;
    };

    
    @UseGuards(WithoutGuard)
    @Query(() => Member)
    public async getMember(@Args("memberId") input: string, @AuthMember('_id') memberId: ObjectId): Promise<Member>{
        console.log("QueryL: getMember")
        const targetId = shapeIntoMongoObjectId(input);
        return await this.memberService.getMember(memberId,targetId);
    };


    @UseGuards(WithoutGuard)
    @Query(() => Members)
    public async getAgents(@Args('input') input: AgentsInquiry, @AuthMember('_id') memberId: ObjectId): Promise<Members>{
        console.log("Query: getAgent");
        return await this.memberService.getAgents(memberId, input);
    }

    //** ADMIN */

    // Authorized APIs(Admin only)
    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Query(() => Members)
    public async getAllMembersByAdmin(@Args("input") input: MembersInquiry): Promise<Members>{
        return await this.memberService.getAllMembersByAdmin(input);
    };

    // Authorized APIs(Admin only)
    @Mutation(() => Member)
    public async updateMembersByAdmin( @Args("input") input: MemberUpdate): Promise<Member>{
        console.log("Mutation: updateMembersByAdmin");
        return await this.memberService.updateMembersByAdmin(input);
    };

}
