import { Global, Module } from '@nestjs/common';
import { ChangeHistoryService } from './services/change-history.service';
import { ChangeHistoryController } from './controllers/change-history.controller';

@Global()
@Module({
  controllers: [ChangeHistoryController],
  providers: [ChangeHistoryService],
  exports: [ChangeHistoryService],
})
export class CommonModule {}
