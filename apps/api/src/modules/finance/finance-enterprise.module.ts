// @ts-nocheck
import { Module } from '@nestjs/common';
import { FinanceEnterpriseService } from './finance-enterprise.service';
import { FinanceEnterpriseController } from './finance-enterprise.controller';

@Module({
  controllers: [FinanceEnterpriseController],
  providers: [FinanceEnterpriseService],
  exports: [FinanceEnterpriseService],
})
export class FinanceEnterpriseModule {}
