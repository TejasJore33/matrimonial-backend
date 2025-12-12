import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post('ticket')
  async createSupportTicket(
    @CurrentUser() user: any,
    @Body() body: {
      subject: string;
      message: string;
      category?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    },
  ) {
    return this.supportService.createSupportTicket(
      user.id,
      body.subject,
      body.message,
      body.category,
      body.priority,
    );
  }

  @Get('tickets')
  async getUserTickets(@CurrentUser() user: any) {
    return this.supportService.getUserTickets(user.id);
  }

  @Get('faq')
  async getFAQ() {
    return this.supportService.getFAQ();
  }

  @Get('contact')
  async getContactInfo() {
    return this.supportService.getContactInfo();
  }
}

