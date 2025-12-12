import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { BookServiceDto, UpdateServiceStatusDto, RateServiceDto, ScheduleBookingDto } from './dto/service.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  // Public endpoint - no auth required
  async getAvailableServices(@Query('category') category?: string) {
    return this.servicesService.getAvailableServices(category);
  }

  @Get('categories')
  // Public endpoint
  async getServiceCategories() {
    return this.servicesService.getServiceCategories();
  }

  @Get('providers')
  // Public endpoint
  async getServiceProviders(@Query('serviceType') serviceType?: string) {
    return this.servicesService.getServiceProviders(serviceType);
  }

  @Post('book')
  @UseGuards(JwtAuthGuard)
  async bookService(@CurrentUser() user: any, @Body() dto: BookServiceDto) {
    return this.servicesService.bookService(user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyServices(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.servicesService.getUserServices(user.id, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getService(@CurrentUser() user: any, @Param('id') id: string) {
    return this.servicesService.getServiceById(id, user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateServiceStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceStatusDto,
  ) {
    return this.servicesService.updateServiceStatus(id, user.id, dto);
  }

  @Put(':id/rate')
  @UseGuards(JwtAuthGuard)
  async rateService(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: RateServiceDto) {
    return this.servicesService.rateService(id, user.id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelService(@CurrentUser() user: any, @Param('id') id: string) {
    return this.servicesService.cancelService(id, user.id);
  }

  @Post('bookings/:bookingId/schedule')
  @UseGuards(JwtAuthGuard)
  async scheduleBooking(@CurrentUser() user: any, @Param('bookingId') bookingId: string, @Body() dto: ScheduleBookingDto) {
    return this.servicesService.scheduleBooking(bookingId, user.id, dto);
  }
}

