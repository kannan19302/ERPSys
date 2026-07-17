import { Module } from '@nestjs/common';
import { PickWavesService } from './pick-waves.service';
import { PickWavesController } from './pick-waves.controller';

@Module({ providers: [PickWavesService], controllers: [PickWavesController] })
export class PickWavesModule {}
