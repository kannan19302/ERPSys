import { Module } from '@nestjs/common';
import { AslController } from './asl.controller';
import { AslService } from './asl.service';

@Module({
  controllers: [AslController],
  providers: [AslService],
  exports: [AslService],
})
export class AslModule {}
