import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { VideoCallService } from './video-call.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('video-call')
@UseGuards(JwtAuthGuard)
export class VideoCallController {
  constructor(private videoCallService: VideoCallService) {}

  @Post('instant')
  async createInstantCall(
    @CurrentUser() user: any,
    @Body() body: { participantId: string; audioOnly?: boolean },
  ) {
    return this.videoCallService.createInstantCall(user.id, body.participantId, body.audioOnly);
  }

  @Post('schedule')
  async scheduleCall(
    @CurrentUser() user: any,
    @Body() body: {
      participantId: string;
      scheduledAt: string;
      duration?: number;
      notes?: string;
    },
  ) {
    return this.videoCallService.scheduleCall(user.id, {
      participantId: body.participantId,
      scheduledAt: new Date(body.scheduledAt),
      duration: body.duration,
      notes: body.notes,
    });
  }

  @Post(':id/start')
  async startCall(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videoCallService.startCall(user.id, id);
  }

  @Put(':id/end')
  async endCall(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videoCallService.endCall(user.id, id);
  }

  @Put(':id/cancel')
  async cancelCall(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videoCallService.cancelCall(user.id, id);
  }

  @Get()
  async getCalls(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('type') type?: 'upcoming' | 'past',
  ) {
    return this.videoCallService.getCalls(user.id, { status, type });
  }

  @Get(':id')
  async getCallById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videoCallService.getCallById(user.id, id);
  }
}

