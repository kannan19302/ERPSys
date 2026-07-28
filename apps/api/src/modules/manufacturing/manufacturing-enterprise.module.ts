import { Module } from '@nestjs/common';
import { ManufacturingEnterpriseController } from './manufacturing-enterprise.controller';
import { ManufacturingEnterpriseService } from './manufacturing-enterprise.service';

@Module({
  controllers: [ManufacturingEnterpriseController],
  providers: [ManufacturingEnterpriseService, ManufacturingEnterpriseController],
  exports: [ManufacturingEnterpriseService],
})
export class ManufacturingEnterpriseModule {}
