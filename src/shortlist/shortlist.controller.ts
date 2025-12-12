import { Controller, Get, Post, Delete, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ShortlistService } from './shortlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('shortlist')
@UseGuards(JwtAuthGuard)
export class ShortlistController {
  constructor(private shortlistService: ShortlistService) {}

  @Post()
  async addToShortlist(
    @CurrentUser() user: any,
    @Body() body: { profileId: string; folderName?: string; notes?: string },
  ) {
    return this.shortlistService.addToShortlist(user.id, body.profileId, body.folderName, body.notes);
  }

  @Delete(':profileId')
  async removeFromShortlist(@CurrentUser() user: any, @Param('profileId') profileId: string) {
    return this.shortlistService.removeFromShortlist(user.id, profileId);
  }

  @Get()
  async getShortlist(@CurrentUser() user: any, @Query('folder') folderName?: string) {
    return this.shortlistService.getShortlist(user.id, folderName);
  }

  @Put(':profileId')
  async updateShortlist(
    @CurrentUser() user: any,
    @Param('profileId') profileId: string,
    @Body() body: { folderName?: string; notes?: string },
  ) {
    return this.shortlistService.updateShortlist(user.id, profileId, body.folderName, body.notes);
  }

  @Get('folders')
  async getFolders(@CurrentUser() user: any) {
    return this.shortlistService.getShortlistFolders(user.id);
  }

  @Get('check/:profileId')
  async checkShortlisted(@CurrentUser() user: any, @Param('profileId') profileId: string) {
    const isShortlisted = await this.shortlistService.isShortlisted(user.id, profileId);
    return { isShortlisted };
  }
}

