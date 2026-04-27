import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { URL } from 'url';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createWinstonLogger } from './common/logger/winston.logger';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { RegionsModule } from './regions/regions.module';
import { TelegramModule } from './telegram/telegram.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    WinstonModule.forRoot(createWinstonLogger()),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = new URL(
          configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        );

        return {
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port || 6379),
            username: redisUrl.username || undefined,
            password: redisUrl.password || undefined,
            db: redisUrl.pathname ? Number(redisUrl.pathname.replace('/', '') || 0) : 0,
          },
        };
      },
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    OrdersModule,
    RegionsModule,
    NotificationsModule,
    AuthModule,
    AdminModule,
    TelegramModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
