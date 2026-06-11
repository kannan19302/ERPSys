import { Module } from '@nestjs/common';
import { ApiPlatformController } from './api-platform.controller';
import { ApiPlatformService } from './api-platform.service';

@Module({
  controllers: [ApiPlatformController],
  providers: [ApiPlatformService],
  exports: [ApiPlatformService],
})
export class ApiPlatformModule {}
