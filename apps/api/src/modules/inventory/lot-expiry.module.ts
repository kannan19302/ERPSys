import { Module } from '@nestjs/common';
import { LotExpiryService } from './lot-expiry.service';
import { LotExpiryController } from './lot-expiry.controller';

@Module({ providers: [LotExpiryService], controllers: [LotExpiryController] })
export class LotExpiryModule {}
