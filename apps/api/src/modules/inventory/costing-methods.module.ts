import { Module } from '@nestjs/common';
import { CostingMethodsService } from './costing-methods.service';
import { CostingMethodsController } from './costing-methods.controller';

@Module({ providers: [CostingMethodsService], controllers: [CostingMethodsController] })
export class CostingMethodsModule {}
