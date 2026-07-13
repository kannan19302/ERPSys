import { Module } from '@nestjs/common';
import { VelocityAbcXyzController } from './velocity-abc-xyz.controller';
import { VelocityAbcXyzService } from './velocity-abc-xyz.service';

@Module({
  controllers: [VelocityAbcXyzController],
  providers: [VelocityAbcXyzService],
  exports: [VelocityAbcXyzService],
})
export class VelocityAbcXyzModule {}
