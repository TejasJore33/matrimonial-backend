import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FamilyService } from './family.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('family')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private familyService: FamilyService) {}

  @Post('members')
  async addFamilyMember(
    @CurrentUser() user: any,
    @Body() body: {
      name: string;
      relation: string;
      email?: string;
      mobile?: string;
      password?: string;
      canViewMatches?: boolean;
      canSendInterests?: boolean;
      canChat?: boolean;
    },
  ) {
    return this.familyService.addFamilyMember(user.id, body);
  }

  @Get('members')
  async getFamilyMembers(@CurrentUser() user: any) {
    return this.familyService.getFamilyMembers(user.id);
  }

  @Put('members/:id')
  async updateFamilyMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      canViewMatches?: boolean;
      canSendInterests?: boolean;
      canChat?: boolean;
    },
  ) {
    return this.familyService.updateFamilyMember(user.id, id, body);
  }

  @Delete('members/:id')
  async deleteFamilyMember(@CurrentUser() user: any, @Param('id') id: string) {
    return this.familyService.deleteFamilyMember(user.id, id);
  }

  @Post('login')
  async loginFamilyMember(@Body() body: { emailOrMobile: string; password: string }) {
    return this.familyService.loginFamilyMember(body.emailOrMobile, body.password);
  }
}

