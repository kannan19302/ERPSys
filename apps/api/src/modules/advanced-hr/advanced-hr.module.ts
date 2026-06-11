import { Module } from '@nestjs/common';
import { AdvancedHrController } from './advanced-hr.controller';
import { AdvancedHrService } from './advanced-hr.service';

@Module({
  controllers: [AdvancedHrController],
  providers: [AdvancedHrService],
  exports: [AdvancedHrService],
})
export class AdvancedHrModule {}
