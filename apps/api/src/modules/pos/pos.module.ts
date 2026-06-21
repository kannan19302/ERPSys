import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';

@Module({
  imports: [EventEmitterModule],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule { }
