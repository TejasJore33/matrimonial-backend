import { Controller, Get, Post, Put, Body, UseGuards, UploadedFile, UseInterceptors, Param, Delete, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post()
  async createProfile(@CurrentUser() user: any, @Body() dto: CreateProfileDto) {
    console.log('=== PROFILE CREATION REQUEST ===');
    console.log('User ID:', user.id);
    console.log('DTO received:', JSON.stringify(dto, null, 2));
    console.log('DTO type:', typeof dto);
    console.log('DTO keys:', Object.keys(dto));
    
    try {
      console.log('Calling profilesService.createProfile...');
      const result = await this.profilesService.createProfile(user.id, dto);
      console.log('Profile created successfully:', result.id);
      return result;
    } catch (error: any) {
      // Log the error for debugging
      console.error('=== PROFILE CREATION ERROR IN CONTROLLER ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      // Re-throw to let NestJS handle it properly
      throw error;
    }
  }

  @Get('me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.profilesService.getProfile(user.id, user.id);
  }

  @Get('me/testimonials')
  async getTestimonials(@CurrentUser() user: any) {
    return this.profilesService.getTestimonials(user.id);
  }

  @Post('me/testimonials')
  async addTestimonial(
    @CurrentUser() user: any,
    @Body() body: { authorName: string; authorRelation?: string; authorEmail?: string; content: string; rating?: number | string },
  ) {
    // Convert rating to number if provided
    const testimonialData = {
      ...body,
      rating: body.rating ? Number(body.rating) : undefined,
    };
    return this.profilesService.addTestimonial(user.id, testimonialData);
  }

  @Get('me/export')
  async exportProfile(@CurrentUser() user: any, @Query('format') format: string = 'json') {
    return this.profilesService.exportProfile(user.id, format);
  }

  @Get('me/completeness')
  async getCompleteness(@CurrentUser() user: any) {
    const profile = await this.profilesService.getProfile(user.id, user.id);
    if (!profile) {
      return { completenessScore: 0, suggestions: [] };
    }
    const suggestions = await this.profilesService.getCompletenessSuggestions(user.id);
    return {
      completenessScore: profile.completenessScore || 0,
      suggestions,
    };
  }

  @Put('me')
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.profilesService.updateProfile(user.id, dto);
  }

  @Get('me/views')
  async getProfileViews(@CurrentUser() user: any, @Query('page') page: string = '1', @Query('limit') limit: string = '20') {
    return this.profilesService.getProfileViews(user.id, parseInt(page), parseInt(limit));
  }

  @Get('me/views/stats')
  async getProfileViewsStats(@CurrentUser() user: any) {
    return this.profilesService.getProfileViewsStats(user.id);
  }

  @Post('me/photos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { isPrimary?: string },
  ) {
    return this.profilesService.uploadPhoto(user.id, file, body.isPrimary === 'true');
  }

  @Delete('me/photos/:photoId')
  async deletePhoto(@CurrentUser() user: any, @Param('photoId') photoId: string) {
    return this.profilesService.deletePhoto(user.id, photoId);
  }

  @Put('me/photos/:photoId/primary')
  async setPrimaryPhoto(@CurrentUser() user: any, @Param('photoId') photoId: string) {
    return this.profilesService.setPrimaryPhoto(user.id, photoId);
  }

  @Post('me/video-intro')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideoIntro(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profilesService.uploadVideoIntro(user.id, file);
  }

  @Post('me/biodata')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBiodata(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profilesService.uploadBiodata(user.id, file);
  }

  @Put('me/privacy')
  async updatePrivacySettings(@CurrentUser() user: any, @Body() body: { settings: any }) {
    return this.profilesService.updatePrivacySettings(user.id, body.settings);
  }

  @Post('me/submit')
  async submitForApproval(@CurrentUser() user: any) {
    return this.profilesService.submitForApproval(user.id);
  }

  @Get(':userId')
  async getProfile(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.profilesService.getProfile(userId, user.id);
  }

  @Get('slug/:slug')
  async getProfileBySlug(@Param('slug') slug: string) {
    return this.profilesService.getProfileBySlug(slug);
  }

  @Post(':userId/unlock-contact')
  async unlockContact(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.profilesService.unlockContact(user.id, userId);
  }

  @Put('me/hide-from-search')
  async hideFromSearch(@CurrentUser() user: any, @Body() body: { hide: boolean }) {
    return this.profilesService.hideFromSearch(user.id, body.hide);
  }

  @Get('me/download-data')
  async downloadUserData(@CurrentUser() user: any) {
    return this.profilesService.downloadUserData(user.id);
  }

  @Delete('me/account')
  async deleteAccount(@CurrentUser() user: any, @Body() body?: { password?: string }) {
    return this.profilesService.deleteAccount(user.id, body?.password);
  }

  @Put('me/photos/:photoId/album')
  async updatePhotoAlbum(
    @CurrentUser() user: any,
    @Param('photoId') photoId: string,
    @Body() body: { albumName?: string; caption?: string },
  ) {
    return this.profilesService.updatePhotoAlbum(user.id, photoId, body.albumName, body.caption);
  }

  @Get('me/photos/albums')
  async getPhotosByAlbum(@CurrentUser() user: any, @Query('album') albumName?: string) {
    return this.profilesService.getPhotosByAlbum(user.id, albumName);
  }
}

