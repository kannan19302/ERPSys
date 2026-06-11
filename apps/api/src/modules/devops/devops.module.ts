import { Module } from '@nestjs/common';
import { DevopsController } from './devops.controller';
import { DevopsService } from './devops.service';

@Module({
  controllers: [DevopsController],
  providers: [DevopsService],
  exports: [DevopsService],
})
export class DevopsModule {}
