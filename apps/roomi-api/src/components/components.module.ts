import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { PropertyModule } from './property/property.module';
import { BookingModule } from './booking/booking.module';
import { AvailabilityModule } from './availability/availability.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { BoardArticleModule } from './board-article/board-article.module';

@Module({
  imports: [AuthModule, MemberModule, PropertyModule, BookingModule, AvailabilityModule, PaymentModule, NotificationModule, CommentModule, LikeModule, ViewModule, BoardArticleModule]
})
export class ComponentsModule {}
