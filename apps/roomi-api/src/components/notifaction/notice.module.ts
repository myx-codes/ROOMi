import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticeService } from './notice.service';
import { NoticeResolver } from './notice.resolver';
import NoticeSchema from '../../schemas/Notification.model';
import { AuthModule } from '../auth/auth.module';


@Module({
    imports: [
        // 1. Schemani MongoDB bilan bog'laymiz
        MongooseModule.forFeature([{ name: 'Notice', schema: NoticeSchema }]),
        AuthModule
    ],
    // 2. Servis va Resolverni ro'yxatdan o'tkazamiz
    providers: [
        NoticeService, 
        NoticeResolver
    ],
    // 3. MUHIM: BookingService boshqa modullarda ishlatishi uchun eksport qilamiz
    exports: [NoticeService],
})
export class NoticeModule {}