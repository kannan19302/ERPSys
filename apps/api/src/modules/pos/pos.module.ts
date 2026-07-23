import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosExpansionController } from './pos-expansion.controller';
import { PosExpansionService } from './pos-expansion.service';

@Module({
  imports: [EventEmitterModule],
  controllers: [PosController, PosExpansionController],
  providers: [PosService, PosExpansionService],
  exports: [PosService, PosExpansionService],
})
export class PosModule { }
