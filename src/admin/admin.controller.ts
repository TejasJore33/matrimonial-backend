import { Controller, Get, Put, Param, Body, UseGuards, Query, Delete, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('profiles/pending')
  async getPendingProfiles(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getPendingProfiles(parseInt(page), parseInt(limit));
  }

  @Get('reports')
  async getReports(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getReports(parseInt(page), parseInt(limit));
  }

  @Put('reports/:id/resolve')
  async resolveReport(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { action: string },
  ) {
    return this.adminService.resolveReport(id, user.id, body.action);
  }

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('analytics/advanced')
  async getAdvancedAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adminService.getAdvancedAnalytics(start, end);
  }

  @Post('profiles/bulk-approve')
  async bulkApproveProfiles(
    @CurrentUser() user: any,
    @Body() body: { profileIds: string[] },
  ) {
    return this.adminService.bulkApproveProfiles(body.profileIds, user.id);
  }

  @Post('profiles/bulk-reject')
  async bulkRejectProfiles(
    @CurrentUser() user: any,
    @Body() body: { profileIds: string[]; reason?: string },
  ) {
    return this.adminService.bulkRejectProfiles(body.profileIds, user.id, body.reason);
  }

  @Get('export')
  async exportData(@Query('format') format: 'csv' | 'json' = 'json') {
    return this.adminService.exportData(format);
  }

  // User Management - specific routes first
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/suspend')
  async suspendUser(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.suspendUser(id, user.id);
  }

  @Put('users/:id/activate')
  async activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Get('users')
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(parseInt(page), parseInt(limit), search);
  }

  // Profile Management - specific routes first
  @Put('profiles/:id/approve')
  async approveProfile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.approveProfile(id, user.id);
  }

  @Put('profiles/:id/reject')
  async rejectProfile(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.rejectProfile(id, user.id, body.reason);
  }

  @Put('profiles/:id/suspend')
  async suspendProfile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.suspendProfile(id, user.id);
  }

  @Delete('profiles/:id')
  async deleteProfile(@Param('id') id: string) {
    return this.adminService.deleteProfile(id);
  }

  @Get('profiles')
  async getAllProfiles(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllProfiles(parseInt(page), parseInt(limit), status, search);
  }

  // Subscription Management
  @Get('subscriptions')
  async getAllSubscriptions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getAllSubscriptions(parseInt(page), parseInt(limit));
  }

  // Payment Management
  @Get('payments')
  async getAllPayments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllPayments(parseInt(page), parseInt(limit), status);
  }

  // Photo Moderation - specific routes first
  @Put('photos/:id/approve')
  async approvePhoto(@Param('id') id: string) {
    return this.adminService.approvePhoto(id);
  }

  @Delete('photos/:id')
  async rejectPhoto(@Param('id') id: string) {
    return this.adminService.rejectPhoto(id);
  }

  @Get('photos/pending')
  async getPendingPhotos(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getPendingPhotos(parseInt(page), parseInt(limit));
  }
}

