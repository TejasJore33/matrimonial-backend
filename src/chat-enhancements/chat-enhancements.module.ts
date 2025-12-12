import { Module } from '@nestjs/common';
import { ChatEnhancementsService } from './chat-enhancements.service';
import { ChatEnhancementsController } from './chat-enhancements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChatEnhancementsService],
  controllers: [ChatEnhancementsController],
  exports: [ChatEnhancementsService],
})
export class ChatEnhancementsModule {}

