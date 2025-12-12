import { Controller, Get, Post, Body, Param, UseGuards, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('community')
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  // Forum
  @Post('forum')
  @UseGuards(JwtAuthGuard)
  async createForumPost(
    @CurrentUser() user: any,
    @Body() body: { title: string; content: string; category?: string; tags?: string[] },
  ) {
    return this.communityService.createForumPost(user.id, body);
  }

  @Get('forum')
  async getForumPosts(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getForumPosts({
      category,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('forum/:postId/comments')
  @UseGuards(JwtAuthGuard)
  async createForumComment(
    @CurrentUser() user: any,
    @Param('postId') postId: string,
    @Body() body: { content: string },
  ) {
    return this.communityService.createForumComment(user.id, postId, body.content);
  }

  // Groups
  @Post('groups')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createGroup(
    @CurrentUser() user: any,
    @Body() body: { name: string; description: string; isPublic: string },
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.communityService.createGroup(user.id, {
      name: body.name,
      description: body.description,
      isPublic: body.isPublic === 'true',
      photo,
    });
  }

  @Get('groups')
  async getGroups(
    @Query('search') search?: string,
    @Query('isPublic') isPublic?: string,
  ) {
    return this.communityService.getGroups({
      search,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
    });
  }

  @Post('groups/:groupId/join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@CurrentUser() user: any, @Param('groupId') groupId: string) {
    return this.communityService.joinGroup(user.id, groupId);
  }

  // Events
  @Post('events')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createEvent(
    @CurrentUser() user: any,
    @Body() body: {
      title: string;
      description: string;
      eventDate: string;
      location: string;
      maxParticipants?: string;
    },
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.communityService.createEvent(user.id, {
      title: body.title,
      description: body.description,
      eventDate: new Date(body.eventDate),
      location: body.location,
      maxParticipants: body.maxParticipants ? parseInt(body.maxParticipants) : undefined,
      photo,
    });
  }

  @Get('events')
  async getEvents(
    @Query('upcoming') upcoming?: string,
    @Query('past') past?: string,
  ) {
    return this.communityService.getEvents({
      upcoming: upcoming === 'true',
      past: past === 'true',
    });
  }

  @Post('events/:eventId/join')
  @UseGuards(JwtAuthGuard)
  async joinEvent(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.communityService.joinEvent(user.id, eventId);
  }

  // Blog
  @Post('blog')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createBlogPost(
    @CurrentUser() user: any,
    @Body() body: { title: string; content: string; excerpt?: string; tags?: string[] },
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.communityService.createBlogPost(user.id, {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      tags: body.tags,
      photo,
    });
  }

  @Get('blog')
  async getBlogPosts(
    @Query('published') published?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getBlogPosts({
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('blog/:id/publish')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async publishBlogPost(@Param('id') id: string) {
    // Implementation for admin to publish blog posts
    return { message: 'Blog post published' };
  }
}

