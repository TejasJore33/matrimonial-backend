import { Controller, Get, Param, Delete, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  async getChats(@CurrentUser() user: any) {
    return this.chatService.getChats(user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    return this.chatService.getUnreadCount(user.id);
  }

  @Post('with-user/:userId')
  async getOrCreateChatWithUser(@CurrentUser() user: any, @Param('userId') otherUserId: string) {
    console.log('Creating/getting chat with user:', { userId: user.id, otherUserId });
    return this.chatService.getOrCreateChat(user.id, otherUserId);
  }

  @Get(':id')
  async getChat(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.getChat(id, user.id);
  }

  @Get(':id/messages')
  async getMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.chatService.getMessages(id, user.id, parseInt(page), parseInt(limit));
  }

  @Post(':id/messages')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { content?: string; imageUrl?: string; videoUrl?: string; audioUrl?: string; fileUrl?: string; fileName?: string; messageType?: string },
  ) {
    return this.chatService.sendMessage(user.id, id, body);
  }

  @Delete('messages/:id')
  async deleteMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('forEveryone') forEveryone?: string,
  ) {
    const deleteForEveryone = forEveryone === 'true';
    return this.chatService.deleteMessage(user.id, id, deleteForEveryone);
  }

  @Post('messages/:id/report')
  async reportMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.chatService.reportMessage(user.id, id, body.reason);
  }

  @Get(':id/search')
  async searchMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.chatService.searchMessages(user.id, id, query, parseInt(page), parseInt(limit));
  }
}

