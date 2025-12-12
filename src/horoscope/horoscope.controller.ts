import { Controller, Get, Post, Body, Param, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HoroscopeService } from './horoscope.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('horoscope')
@UseGuards(JwtAuthGuard)
export class HoroscopeController {
  constructor(private horoscopeService: HoroscopeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadHoroscope(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      birthTime?: string;
      birthPlace?: string;
      rashi?: string;
      nakshatra?: string;
      mangalDosha?: string;
    },
  ) {
    return this.horoscopeService.uploadHoroscope(user.id, file, {
      birthTime: body.birthTime,
      birthPlace: body.birthPlace,
      rashi: body.rashi,
      nakshatra: body.nakshatra,
      mangalDosha: body.mangalDosha === 'true',
    });
  }

  @Get()
  async getHoroscope(@CurrentUser() user: any) {
    return this.horoscopeService.getHoroscope(user.id);
  }

  @Post('match/:userId')
  async matchHoroscopes(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.horoscopeService.matchHoroscopes(user.id, userId);
  }

  @Get('match/:userId')
  async getHoroscopeMatch(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.horoscopeService.getHoroscopeMatch(user.id, userId);
  }
}

