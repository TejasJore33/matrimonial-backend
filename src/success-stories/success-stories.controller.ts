import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SuccessStoriesService } from './success-stories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('success-stories')
export class SuccessStoriesController {
  constructor(private successStoriesService: SuccessStoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 10))
  async submitStory(
    @CurrentUser() user: any,
    @Body() body: { partnerId: string; title: string; story: string; weddingDate?: string },
    @UploadedFiles() photos?: Express.Multer.File[],
  ) {
    const weddingDate = body.weddingDate ? new Date(body.weddingDate) : undefined;
    return this.successStoriesService.submitStory(user.id, body.partnerId, body.title, body.story, weddingDate, photos);
  }

  @Get()
  async getStories(
    @Query('approved') approved?: string,
    @Query('featured') featured?: string,
    @Query('limit') limit?: string,
    @Query('region') region?: string,
    @Query('religion') religion?: string,
    @Query('page') page?: string,
  ) {
    if (featured === 'true') {
      return this.successStoriesService.getFeaturedStories(limit ? parseInt(limit) : 10);
    }

    if (region || religion) {
      return this.successStoriesService.getStoriesByFilters({
        region,
        religion,
        limit: limit ? parseInt(limit) : undefined,
        page: page ? parseInt(page) : undefined,
      });
    }

    return this.successStoriesService.getStories({
      approved: approved === 'true' ? true : approved === 'false' ? false : undefined,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('featured')
  async getFeaturedStories(@Query('limit') limit?: string) {
    return this.successStoriesService.getFeaturedStories(limit ? parseInt(limit) : 10);
  }

  @Get('stats')
  async getStoryStats() {
    return this.successStoriesService.getStoryStats();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getUserStories(@CurrentUser() user: any) {
    return this.successStoriesService.getUserStories(user.id);
  }

  @Get(':id')
  async getStoryById(@Param('id') id: string) {
    return this.successStoriesService.getStoryById(id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approveStory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.successStoriesService.approveStory(id, user.id);
  }

  @Post(':id/feature')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async featureStory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.successStoriesService.featureStory(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteStory(@CurrentUser() user: any, @Param('id') id: string) {
    const isAdmin = user.role === 'ADMIN';
    return this.successStoriesService.deleteStory(id, user.id, isAdmin);
  }
}

