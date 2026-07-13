import { Module } from '@nestjs/common';
import { FreightClaimsService } from './freight-claims.service';
import { FreightClaimsController } from './freight-claims.controller';

@Module({ providers: [FreightClaimsService], controllers: [FreightClaimsController] })
export class FreightClaimsModule {}
