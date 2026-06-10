import * as fs from 'fs';
import * as path from 'path';

// Programmatically load environment variables from .env files
function loadEnv() {
  const rootEnv = path.resolve(__dirname, '../../../.env');
  const apiEnv = path.resolve(__dirname, '../.env');

  const loadFile = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const index = trimmed.indexOf('=');
          if (index !== -1) {
            const key = trimmed.substring(0, index).trim();
            const value = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
            if (key) {
              process.env[key] = value;
            }
          }
        }
      }
    }
  };

  loadFile(rootEnv);
  loadFile(apiEnv);
}

loadEnv();

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix for all API routes
  app.setGlobalPrefix('api/v1');

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);

  logger.log(`🚀 UniERP API running on http://localhost:${port}/api/v1`);
}

bootstrap();
