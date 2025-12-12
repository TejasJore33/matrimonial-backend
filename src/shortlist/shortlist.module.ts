import { Module } from '@nestjs/common';
import { ShortlistService } from './shortlist.service';
import { ShortlistController } from './shortlist.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShortlistController],
  providers: [ShortlistService],
  exports: [ShortlistService],
})
export class ShortlistModule {}

