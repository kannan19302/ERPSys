import { Module } from '@nestjs/common';
import { CrossDockService } from './cross-dock.service';
import { CrossDockController } from './cross-dock.controller';

@Module({ providers: [CrossDockService], controllers: [CrossDockController] })
export class CrossDockModule {}
