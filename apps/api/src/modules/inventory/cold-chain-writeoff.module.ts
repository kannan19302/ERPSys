import { Module } from '@nestjs/common';
import { ColdChainWriteoffController } from './cold-chain-writeoff.controller';
import { ColdChainWriteoffService } from './cold-chain-writeoff.service';

@Module({
  controllers: [ColdChainWriteoffController],
  providers: [ColdChainWriteoffService],
  exports: [ColdChainWriteoffService],
})
export class ColdChainWriteoffModule {}
