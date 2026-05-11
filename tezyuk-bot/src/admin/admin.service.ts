import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { serializeBigInts } from 'src/common/utils/serialize.util';
import { OrdersService } from 'src/orders/orders.service';
import { RegionsService } from 'src/regions/regions.service';
import { SettingsService } from 'src/settings/settings.service';
import { UsersService } from 'src/users/users.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly regionsService: RegionsService,
    private readonly settingsService: SettingsService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async getOrders(params: {
    status?: OrderStatus;
    region?: string;
    page: number;
    limit: number;
  }) {
    return serializeBigInts(await this.ordersService.listForAdmin(params));
  }

  async getOrderById(id: string) {
    return serializeBigInts(await this.ordersService.findById(id));
  }

  updateOrder(id: string, dto: UpdateOrderDto) {
    return this.ordersService.updateOrder(id, dto);
  }

  async deleteOrder(id: string) {
    const order = await this.ordersService.cancelOrder(id);
    const groupId = this.configService.get<string>('GROUP_ID', '');

    if (order.telegramMessageId && groupId) {
      try {
        await this.bot.telegram.deleteMessage(groupId, order.telegramMessageId);
      } catch (err) {
        this.logger.warn(
          `Guruh xabarini o'chirib bo'lmadi: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    try {
      const user = await this.usersService.ensureExists(order.userId);
      const fromDistrict = order.fromDistrict ? `, ${order.fromDistrict}` : '';
      const toDistrict = order.toDistrict ? `, ${order.toDistrict}` : '';
      await this.bot.telegram.sendMessage(
        Number(user.telegramId),
        `❌ Sizning e'loningiz admin tomonidan bekor qilindi.\n\n` +
          `📦 ${order.cargoName}\n` +
          `📍 ${order.fromRegion}${fromDistrict} → ${order.toRegion}${toDistrict}`,
      );
    } catch (err) {
      this.logger.warn(
        `Foydalanuvchiga xabar yuborib bo'lmadi: ${err instanceof Error ? err.message : err}`,
      );
    }

    return order;
  }

  async getUsers(page: number, limit: number) {
    return serializeBigInts(await this.usersService.list(page, limit));
  }

  async toggleUserBlock(id: string) {
    return serializeBigInts(await this.usersService.toggleBlock(id));
  }

  getRegions() {
    return this.regionsService.listAll();
  }

  createRegion(dto: CreateRegionDto) {
    return this.regionsService.createRegion(dto);
  }

  updateRegion(id: number, dto: UpdateRegionDto) {
    return this.regionsService.updateRegion(id, dto);
  }

  getStats() {
    return this.ordersService.getStats();
  }

  getSettings() {
    return this.settingsService.getSettings();
  }

  updateSettings(dto: UpdateSettingsDto) {
    return this.settingsService.updateDailyLimit(dto.dailyOrderLimit);
  }

  async setUserDailyLimit(id: string, limit: number | null) {
    return serializeBigInts(await this.usersService.setDailyLimit(id, limit));
  }
}
