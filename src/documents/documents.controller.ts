import { Controller, Get, Post, Delete, Body, Param, UseGuards, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type: string; name: string; expiryDate?: string },
  ) {
    const expiryDate = body.expiryDate ? new Date(body.expiryDate) : undefined;
    return this.documentsService.uploadDocument(user.id, file, body.type, body.name, expiryDate);
  }

  @Get()
  async getDocuments(@CurrentUser() user: any) {
    return this.documentsService.getDocuments(user.id);
  }

  @Get(':id')
  async getDocument(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.getDocumentById(user.id, id);
  }

  @Delete(':id')
  async deleteDocument(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.deleteDocument(user.id, id);
  }

  @Post(':id/verify')
  @UseGuards(AdminGuard)
  async verifyDocument(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.verifyDocument(id, user.id);
  }

  @Get('admin/expiring')
  @UseGuards(AdminGuard)
  async getExpiringDocuments(@Query('days') days?: string) {
    return this.documentsService.getExpiringDocuments(days ? parseInt(days) : 30);
  }
}

