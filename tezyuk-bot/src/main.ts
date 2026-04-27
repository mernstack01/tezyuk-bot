import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

// BigInt can't be serialized to JSON by default; convert to string
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

const REQUIRED_ENV = [
  'BOT_TOKEN',
  'GROUP_ID',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
] as const;

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Copy .env.example to .env and fill in all values.`,
    );
  }
  if (process.env.JWT_SECRET === 'change_me') {
    throw new Error('JWT_SECRET must be changed from the default value.');
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true,
  });
  app.setGlobalPrefix('');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('YukMarkaz API')
    .setDescription('YukMarkaz admin API hujjatlari')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
