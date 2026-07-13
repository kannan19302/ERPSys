import { Module } from '@nestjs/common';
import { VmiService } from './vmi.service';
import { VmiController } from './vmi.controller';

@Module({ providers: [VmiService], controllers: [VmiController] })
export class VmiModule {}
