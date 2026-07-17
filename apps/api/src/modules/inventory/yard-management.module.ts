import { Module } from '@nestjs/common';
import { YardManagementController } from './yard-management.controller';
import { YardManagementService } from './yard-management.service';

@Module({
  controllers: [YardManagementController],
  providers: [YardManagementService],
  exports: [YardManagementService],
})
export class YardManagementModule {}
