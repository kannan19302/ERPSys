import { Module } from '@nestjs/common';
import { FieldServiceController } from './field-service.controller';
import { FieldServiceService } from './field-service.service';
import { DispatchService } from './dispatch.service';

@Module({
  controllers: [FieldServiceController],
  providers: [FieldServiceService, DispatchService],
  exports: [FieldServiceService, DispatchService],
})
export class FieldServiceModule {}
