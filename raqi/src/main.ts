import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { setupSwagger } from './common/swagger/setup';
import { AppModule } from './app.module';
import { ensureDepositsUploadDir } from './modules/wallets/upload.config';

async function bootstrap() {
  ensureDepositsUploadDir();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const defaultOrigins = [
    'http://localhost:5173',
    'https://dashboard.raqii.com.ly',
    'http://dashboard.raqii.com.ly',
  ];
  const allowedOrigins = new Set(
    [...defaultOrigins, ...(configService.get<string[]>('corsOrigins') ?? [])]
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.has(normalized)) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  const port = configService.get<number>('port', 3000);
  await app.listen(port);
}
bootstrap();
