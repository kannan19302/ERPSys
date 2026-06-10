import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Security
    app.use(helmet());
    app.enableCors({
        origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
        credentials: true,
    });
    // Global prefix for all API routes
    app.setGlobalPrefix('api/v1');
    const port = process.env.API_PORT ?? 4000;
    await app.listen(port);
    console.log(`🚀 UniERP API running on http://localhost:${port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map