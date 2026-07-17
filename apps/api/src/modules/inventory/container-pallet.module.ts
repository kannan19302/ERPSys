import { Module } from '@nestjs/common';
import { ContainerPalletController } from './container-pallet.controller';
import { ContainerPalletService } from './container-pallet.service';

@Module({
  controllers: [ContainerPalletController],
  providers: [ContainerPalletService],
  exports: [ContainerPalletService],
})
export class ContainerPalletModule {}
