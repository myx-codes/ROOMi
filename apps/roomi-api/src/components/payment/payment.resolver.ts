import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { PaymentService } from "./payment.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/auth.guard";
import { Payment } from "../../libs/dto/payment/payment";
import { AuthMember } from "../auth/decorators/authMember.decorator";
import { Types } from "mongoose";
import { PaymentMethod } from "../../libs/enums/payment.enum";

@Resolver()
export class PaymentResolver {
    constructor(private readonly paymentService: PaymentService) {}

    @UseGuards(AuthGuard)
    @Mutation(() => Payment)
    public async checkout(
        @Args('bookingId') bookingId: string,
        @Args('paymentMethod', { type: () => PaymentMethod, nullable: true }) paymentMethod: PaymentMethod,
        @AuthMember('_id') memberId: Types.ObjectId,
    ): Promise<Payment> {
        return await this.paymentService.checkout(memberId, bookingId, paymentMethod);
    }
}