import { Mutation, Resolver, Query, Args, Context } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { BadRequestException,  UseGuards} from '@nestjs/common';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { Member, Members } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { Types } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { getSerialForImage, shapeIntoMongoObjectId, validMimeTypes } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { Message } from '../../libs/enums/common.enum';
import { Response } from 'express';
import {
    AUTH_COOKIE_NAME,
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    authCookieOptions,
    clearCookieOptions,
    csrfCookieOptions,
    generateCsrfToken,
} from '../auth/auth-cookie.util';


@Resolver()
export class MemberResolver {
    constructor( private readonly memberService: MemberService) {}

    private resolveUploadDir(target: String): string {
        // Prevent invalid directory names and ensure upload dir exists.
        const safeTarget = String(target).replace(/[^a-zA-Z0-9_\/-]/g, '') || 'misc';
        const uploadDir = join('uploads', safeTarget);
        mkdirSync(uploadDir, { recursive: true });
        return uploadDir;
    }

    private async saveUpload(file: FileUpload, target: String): Promise<string> {
        const { createReadStream, filename, mimetype } = file;

        if (!filename) throw new BadRequestException(Message.UPLOAD_FAILED);
        if (!validMimeTypes.includes(mimetype)) {
            throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
        }

        const uploadDir = this.resolveUploadDir(target);
        const imageName = getSerialForImage(filename);
        const filePath = join(uploadDir, imageName);
        const publicUrl = `${uploadDir}/${imageName}`;

        await new Promise<void>((resolve, reject) => {
            createReadStream()
                .pipe(createWriteStream(filePath))
                .on('finish', () => resolve())
                .on('error', (err) => reject(err));
        });

        return publicUrl;
    }

    @Mutation(() => Member)
    public async signup(@Args("input") input: MemberInput): Promise<Member>{
        console.log("Mutation: signup")
        return await this.memberService.signup(input);
       
    };

    @Mutation(() => Member)
    public async login(@Args("input") input: LoginInput, @Context() context: any): Promise<Member>{
        console.log("Mutation: login")
        const result = await this.memberService.login(input);
        const response: Response | undefined = context?.res;

        if (response && result.accessToken) {
            const csrfToken = generateCsrfToken();
            response.cookie(AUTH_COOKIE_NAME, result.accessToken, authCookieOptions());
            response.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
            response.setHeader(CSRF_HEADER_NAME, csrfToken);
        }

        return result;
    };

    @UseGuards(AuthGuard)
    @Mutation(() => String)
    public async logout(@Context() context: any): Promise<string> {
        const response: Response | undefined = context?.res;
        if (response) {
            const options = clearCookieOptions();
            response.clearCookie(AUTH_COOKIE_NAME, options);
            response.clearCookie(CSRF_COOKIE_NAME, options);
        }
        return 'Logout successful';
    }


    // Authenticated APIs 
    @UseGuards(AuthGuard)
    @Mutation(() => Member)
    public async updateMember(
        @Args("input") input: MemberUpdate,
        @AuthMember('_id') memberId: Types.ObjectId): Promise<Member>{
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
    public async getMember(@Args("memberId") input: string, @AuthMember('_id') memberId: Types.ObjectId): Promise<Member>{
        console.log("QueryL: getMember")
        const targetId = shapeIntoMongoObjectId(input);
        return await this.memberService.getMember(memberId,targetId);
    };


    @UseGuards(WithoutGuard)
    @Query(() => Members)
    public async getAgents(@Args('input') input: AgentsInquiry, @AuthMember('_id') memberId: Types.ObjectId): Promise<Members>{
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



    // IMAGE UPLOADER 
    @UseGuards(AuthGuard)
    @Mutation((returns) => String)
    public async imageUploader(
        @Args({ name: 'file', type: () => GraphQLUpload })
    file: FileUpload,
    @Args('target') target: String,
    ): Promise<string> {
        console.log('Mutation: imageUploader');

        try {
            return await this.saveUpload(file, target);
        } catch (err: any) {
            console.log('Upload failed:', err?.message || err);
            throw err;
        }
    }

    @UseGuards(AuthGuard)
    @Mutation((returns) => [String])
    public async imagesUploader(
        @Args('files', { type: () => [GraphQLUpload] })
    files: Promise<FileUpload>[],
    @Args('target') target: String,
    ): Promise<string[]> {
        console.log('Mutation: imagesUploader');

        const uploadedImages: string[] = [];

        try {
            // Sequential writes avoid excessive listeners when many files are uploaded at once.
            for (const filePromise of files) {
                const file = await filePromise;
                const url = await this.saveUpload(file, target);
                uploadedImages.push(url);
            }

            return uploadedImages;
        } catch (err: any) {
            console.log('Images upload failed:', err?.message || err);
            throw new BadRequestException(err?.message || Message.UPLOAD_FAILED);
        }
    };




    @UseGuards(AuthGuard)
    @Mutation(() => Member)
    public async likeTargetMember(
        @Args('memberId') input: string,
        @AuthMember('_id') memberId: Types.ObjectId
    ): Promise<Member> {
        console.log("Mutation: LikeTargetMember");
        const likeRefid = shapeIntoMongoObjectId(input);
        return await this.memberService.likeTargetMember(memberId, likeRefid);
    }


}
