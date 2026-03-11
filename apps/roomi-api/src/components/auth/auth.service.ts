import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { JwtService } from '@nestjs/jwt';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) {}

    public async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return await bcrypt.hash(password, salt);
    }

    public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    public async createToken(member: Member): Promise<string> {
        // Mongoose obyektini oddiy JS obyektiga o'tkazamiz
        const memberData = member['_doc'] ? member['_doc'] : member;

        // Payloadni faqat kerakli fieldlar bilan shakllantiramiz
        const payload = {
            _id: memberData._id,
            memberNick: memberData.memberNick,
            memberType: memberData.memberType,
            memberStatus: memberData.memberStatus,
        };

        return await this.jwtService.signAsync(payload);
    }

    public async verifyToken(token: string): Promise<Member> {
        try {
            const member = await this.jwtService.verifyAsync<Member>(token);
            // String IDni Mongo ObjectId ga o'tkazamiz
            member._id = shapeIntoMongoObjectId(member._id);
            return member;
        } catch (err) {
            throw new UnauthorizedException('Token is invalid or expired');
        }
    }
}