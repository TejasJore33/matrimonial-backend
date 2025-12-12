import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BlockService } from './block.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('block')
@UseGuards(JwtAuthGuard)
export class BlockController {
  constructor(private blockService: BlockService) {}

  @Post()
  async blockUser(
    @CurrentUser() user: any,
    @Body() body: { userId: string; reason?: string },
  ) {
    return this.blockService.blockUser(user.id, body.userId, body.reason);
  }

  @Delete(':userId')
  async unblockUser(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.blockService.unblockUser(user.id, userId);
  }

  @Get()
  async getBlockedUsers(@CurrentUser() user: any) {
    return this.blockService.getBlockedUsers(user.id);
  }

  @Get('check/:userId')
  async checkBlocked(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.blockService.checkBlockedStatus(user.id, userId);
  }
}

