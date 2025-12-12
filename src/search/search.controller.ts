import { Controller, Get, Post, Delete, Query, Body, UseGuards, Param } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchFiltersDto } from './dto/search.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser() user: any,
    @Query() query: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy?: string,
    @Query('activity') activity?: string,
  ) {
    // Transform query parameters to proper types
    const filters: any = {};
    
    // Handle arrays - query params with same key become arrays
    const arrayFields = ['religions', 'castes', 'motherTongue', 'cities', 'states', 'countries', 'educations', 'occupations', 'maritalStatuses', 'diets', 'familyTypes'];
    arrayFields.forEach(field => {
      if (query[field]) {
        filters[field] = Array.isArray(query[field]) ? query[field] : [query[field]];
      }
    });

    // Handle single values
    if (query.gender) filters.gender = query.gender;
    if (query.minAge) filters.minAge = parseInt(query.minAge);
    if (query.maxAge) filters.maxAge = parseInt(query.maxAge);
    if (query.minHeight) filters.minHeight = parseInt(query.minHeight);
    if (query.maxHeight) filters.maxHeight = parseInt(query.maxHeight);
    if (query.religion) filters.religion = query.religion;
    if (query.caste) filters.caste = query.caste;
    if (query.city) filters.city = query.city;
    if (query.state) filters.state = query.state;
    if (query.education) filters.education = query.education;
    if (query.minIncome) filters.minIncome = parseInt(query.minIncome);
    if (query.maxIncome) filters.maxIncome = parseInt(query.maxIncome);
    if (query.manglik !== undefined) filters.manglik = query.manglik === 'true' || query.manglik === true;
    if (query.withPhoto !== undefined) filters.withPhoto = query.withPhoto === 'true' || query.withPhoto === true;
    if (query.verifiedOnly !== undefined) filters.verifiedOnly = query.verifiedOnly === 'true' || query.verifiedOnly === true;
    if (query.workingAbroad !== undefined) filters.workingAbroad = query.workingAbroad === 'true' || query.workingAbroad === true;
    if (query.nri !== undefined) filters.nri = query.nri === 'true' || query.nri === true;
    if (query.smoking !== undefined) filters.smoking = query.smoking === 'true' || query.smoking === true;
    if (query.drinking !== undefined) filters.drinking = query.drinking === 'true' || query.drinking === true;

    // Save search history
    this.searchService.saveSearchHistory(user.id, undefined, filters).catch(() => {});

    if (activity) {
      return this.searchService.searchByActivity(
        user.id,
        filters as SearchFiltersDto,
        activity as any,
        parseInt(page),
        parseInt(limit),
      );
    }

    if (sortBy) {
      return this.searchService.searchWithSort(user.id, filters as SearchFiltersDto, sortBy, parseInt(page), parseInt(limit));
    }

    return this.searchService.search(user.id, filters as SearchFiltersDto, parseInt(page), parseInt(limit));
  }

  @Get('recently-joined')
  async getRecentlyJoined(@CurrentUser() user: any, @Query('limit') limit: string = '20') {
    return this.searchService.getRecentlyJoined(user.id, parseInt(limit));
  }

  @Get('premium')
  async getPremiumProfiles(@CurrentUser() user: any, @Query('limit') limit: string = '20') {
    return this.searchService.getPremiumProfiles(user.id, parseInt(limit));
  }

  @Get('history')
  async getSearchHistory(@CurrentUser() user: any, @Query('limit') limit: string = '20') {
    return this.searchService.getSearchHistory(user.id, parseInt(limit));
  }

  @Get('daily-matches')
  async getDailyMatches(@CurrentUser() user: any, @Query('limit') limit: string = '20') {
    return this.searchService.getDailyMatches(user.id, parseInt(limit));
  }

  @Post('saved')
  async saveSearch(
    @CurrentUser() user: any,
    @Body() body: { name: string; filters: any },
  ) {
    return this.searchService.saveSearch(user.id, body.name, body.filters);
  }

  @Get('saved')
  async getSavedSearches(@CurrentUser() user: any) {
    return this.searchService.getSavedSearches(user.id);
  }

  @Delete('saved/:id')
  async deleteSavedSearch(@CurrentUser() user: any, @Param('id') id: string) {
    return this.searchService.deleteSavedSearch(user.id, id);
  }
}

