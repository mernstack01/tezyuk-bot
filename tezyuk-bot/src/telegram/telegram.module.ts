import { Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule, TELEGRAF_STAGE } from 'nestjs-telegraf';
import { Scenes, session } from 'telegraf';
import { Redis } from 'ioredis';
import { OrdersModule } from 'src/orders/orders.module';
import { OrdersService } from 'src/orders/orders.service';
import { RegionsModule } from 'src/regions/regions.module';
import { RegionsService } from 'src/regions/regions.service';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { RegisteredGuard } from './guards/registered.guard';
import { createOrderScene } from './scenes/order.scene';
import { createRegisterScene } from './scenes/register.scene';
import { TelegramService } from './telegram.service';

const SESSION_TTL_SECONDS = 3600;

// Module-scoped reference for graceful shutdown
let sessionRedis: Redis | null = null;

function createRedisSessionStore(redis: Redis) {
  return {
    async get(key: string) {
      const data = await redis.get(`tg:session:${key}`);
      return data ? (JSON.parse(data) as object) : undefined;
    },
    async set(key: string, value: object) {
      await redis.setex(`tg:session:${key}`, SESSION_TTL_SECONDS, JSON.stringify(value));
    },
    async delete(key: string) {
      await redis.del(`tg:session:${key}`);
    },
  };
}

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        sessionRedis = new Redis(
          configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        );

        const token = configService.get<string>('BOT_TOKEN', '');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const webhookDomain = configService.get<string>('WEBHOOK_DOMAIN', '');

        if (!isProduction || !webhookDomain) {
          // Interrupt any existing polling session (local or remote)
          // before starting our own — prevents 409 Conflict
          try {
            await fetch(
              `https://api.telegram.org/bot${token}/getUpdates?timeout=0&offset=-1`,
            );
          } catch {}
        }

        return {
          token,
          middlewares: [session({ store: createRedisSessionStore(sessionRedis) })],
          launchOptions: isProduction && webhookDomain
            ? {
                webhook: {
                  domain: webhookDomain,
                  port: Number(configService.get<string>('PORT', '9001')),
                },
              }
            : {
                dropPendingUpdates: true,
              },
        };
      },
    }),
    UsersModule,
    OrdersModule,
    RegionsModule,
  ],
  providers: [
    TelegramService,
    RegisteredGuard,
    {
      provide: 'SCENE_REGISTRAR',
      inject: [TELEGRAF_STAGE, UsersService, OrdersService, RegionsService],
      useFactory: (
        stage: Scenes.Stage<Scenes.WizardContext>,
        usersService: UsersService,
        ordersService: OrdersService,
        regionsService: RegionsService,
      ) => {
        stage.register(
          createRegisterScene(usersService),
          createOrderScene(ordersService, usersService, regionsService),
        );
      },
    },
  ],
})
export class TelegramModule implements OnModuleDestroy {
  onModuleDestroy() {
    sessionRedis?.disconnect();
    sessionRedis = null;
  }
}
