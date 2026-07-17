import { Module } from '@nestjs/common';
import { AiModule } from '../../modules/ai/ai.module';
import { AiService } from '../../modules/ai/ai.service';
import { AiClient } from './ai-client';

/**
 * Composition-layer adapter that exposes AI capabilities through the common
 * application port. It is the only allowed bridge from feature modules to the
 * AI implementation.
 */
@Module({
  imports: [AiModule],
  providers: [{ provide: AiClient, useExisting: AiService }],
  exports: [AiClient],
})
export class AiClientModule {}
