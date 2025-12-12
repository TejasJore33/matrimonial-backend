import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { LocalizationService } from './localization.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('localization')
export class LocalizationController {
  constructor(private localizationService: LocalizationService) {}

  @Get('languages')
  async getSupportedLanguages() {
    return this.localizationService.getSupportedLanguages();
  }

  @Get('translations')
  async getTranslations(@Query('lang') lang: string = 'en') {
    return this.localizationService.getTranslations(lang);
  }

  @Get('translate/:key')
  async translate(@Param('key') key: string, @Query('lang') lang: string = 'en') {
    return { key, translation: await this.localizationService.translate(key, lang) };
  }

  @Get('currency/convert')
  async convertCurrency(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return {
      amount: parseFloat(amount),
      from,
      to,
      converted: await this.localizationService.convertCurrency(parseFloat(amount), from, to),
    };
  }

  @Get('user-language')
  @UseGuards(JwtAuthGuard)
  async getUserLanguage(@CurrentUser() user: any) {
    return { language: await this.localizationService.getUserLanguage(user.id) };
  }

  @Post('user-language')
  @UseGuards(JwtAuthGuard)
  async setUserLanguage(@CurrentUser() user: any, @Body() body: { language: string }) {
    await this.localizationService.setUserLanguage(user.id, body.language);
    return { message: 'Language preference updated' };
  }
}

