import { Module } from '@nestjs/common';
import { AdvancedHrController } from './advanced-hr.controller';
import { AdvancedHrService } from './advanced-hr.service';
import { PayrollTaxService } from './payroll-tax.service';
import { HrDeepController } from './hr-deep.controller';

@Module({
  controllers: [AdvancedHrController, HrDeepController],
  providers: [AdvancedHrService, PayrollTaxService],
  exports: [AdvancedHrService, PayrollTaxService],
})
export class AdvancedHrModule {}
