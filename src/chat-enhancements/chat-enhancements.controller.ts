import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ChatEnhancementsService } from './chat-enhancements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('chat-enhancements')
@UseGuards(JwtAuthGuard)
export class ChatEnhancementsController {
  constructor(private chatEnhancementsService: ChatEnhancementsService) {}

  @Get('templates')
  async getMessageTemplates(
    @CurrentUser() user: any,
    @Query('category') category?: string,
  ) {
    return this.chatEnhancementsService.getMessageTemplates(user.id, category);
  }

  @Post('templates')
  async createMessageTemplate(
    @CurrentUser() user: any,
    @Body() body: { name: string; content: string; category?: string },
  ) {
    return this.chatEnhancementsService.createMessageTemplate(user.id, body.name, body.content, body.category);
  }

  @Put('templates/:id')
  async updateMessageTemplate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { name?: string; content?: string; category?: string },
  ) {
    return this.chatEnhancementsService.updateMessageTemplate(user.id, id, body.name, body.content, body.category);
  }

  @Delete('templates/:id')
  async deleteMessageTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatEnhancementsService.deleteMessageTemplate(user.id, id);
  }

  @Get('ice-breakers/:profileId')
  async getIceBreakers(@CurrentUser() user: any, @Param('profileId') profileId: string) {
    return this.chatEnhancementsService.getIceBreakers(user.id, profileId);
  }

  @Post('ice-breakers/:profileId')
  async saveIceBreaker(
    @CurrentUser() user: any,
    @Param('profileId') profileId: string,
    @Body() body: { question: string; answer?: string },
  ) {
    return this.chatEnhancementsService.saveIceBreaker(user.id, profileId, body.question, body.answer);
  }

  @Get('reminders')
  async getChatReminders(@CurrentUser() user: any) {
    return this.chatEnhancementsService.getChatReminders(user.id);
  }
}

