import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { AgentDashboardOverview } from '../../libs/dto/agent-dashboard/agent-dashboard';
import { AgentDashboardService } from './agent-dashboard.service';

@Resolver(() => AgentDashboardOverview)
export class AgentDashboardResolver {
  constructor(private readonly agentDashboardService: AgentDashboardService) {}

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => AgentDashboardOverview)
  public async getAgentDashboardOverview(
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<AgentDashboardOverview> {
    return await this.agentDashboardService.getOverview(memberId);
  }
}
