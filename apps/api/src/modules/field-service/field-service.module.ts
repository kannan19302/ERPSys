import { Module } from '@nestjs/common';
import { FieldServiceController } from './field-service.controller';
import { FieldServiceService } from './field-service.service';

@Module({
  controllers: [FieldServiceController],
  providers: [FieldServiceService],
  exports: [FieldServiceService],
})
export class FieldServiceModule {}
