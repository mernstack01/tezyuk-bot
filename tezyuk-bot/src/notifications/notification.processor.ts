import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { formatAnnouncement } from 'src/common/utils/formatter.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @InjectBot() private readonly bot: Telegraf,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string }>): Promise<void> {
    if (job.name === 'expire-order') {
      return this.handleExpiry(job.data.orderId);
    }
    return this.handleNotification(job.data.orderId);
  }

  private async handleNotification(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      this.logger.warn(`Buyurtma topilmadi: ${orderId}`);
      return;
    }

    const fromRegion = await this.prisma.region.findUnique({
      where: { key: order.fromRegion },
    });
    const toRegion = await this.prisma.region.findUnique({
      where: { key: order.toRegion },
    });

    if (!fromRegion || !fromRegion.isActive) {
      throw new Error(`Hudud faol emas: ${order.fromRegion}`);
    }

    const groupId = this.configService.get<string>('GROUP_ID', '');
    const announcementTopicId = Number(
      this.configService.get<string>('ANNOUNCEMENT_TOPIC_ID', '1'),
    );
    const text = formatAnnouncement(order, fromRegion, toRegion);
    const parseMode = 'Markdown' as const;

    let sentMessageId: number | undefined;

    try {
      const announcementMsg = await this.bot.telegram.sendMessage(groupId, text, {
        parse_mode: parseMode,
        message_thread_id: announcementTopicId,
      });
      sentMessageId = announcementMsg.message_id;
    } catch (err) {
      this.logger.warn(
        `Elonlar topiciga yuborib bo'lmadi (id=${announcementTopicId}): ${err instanceof Error ? err.message : err}`,
      );
    }

    if (fromRegion.topicId > 0 && fromRegion.topicId !== announcementTopicId) {
      try {
        const regionMsg = await this.bot.telegram.sendMessage(groupId, text, {
          parse_mode: parseMode,
          message_thread_id: fromRegion.topicId,
        });
        sentMessageId = sentMessageId ?? regionMsg.message_id;
      } catch (err) {
        this.logger.warn(
          `Viloyat topiciga yuborib bo'lmadi (id=${fromRegion.topicId}): ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { telegramMessageId: sentMessageId },
    });

    this.logger.log(`Telegram e'loni yuborildi: ${orderId}`);
  }

  private async handleExpiry(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order || order.status !== OrderStatus.active) {
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.expired },
    });

    const groupId = this.configService.get<string>('GROUP_ID', '');
    if (order.telegramMessageId && groupId) {
      try {
        await this.bot.telegram.deleteMessage(groupId, order.telegramMessageId);
      } catch (err) {
        this.logger.warn(
          `Muddati tugagan e'lon xabarini o'chirib bo'lmadi: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    try {
      const fromDistrict = order.fromDistrict ? `, ${order.fromDistrict}` : '';
      const toDistrict = order.toDistrict ? `, ${order.toDistrict}` : '';
      await this.bot.telegram.sendMessage(
        Number(order.user.telegramId),
        `⏰ E'loningiz muddati tugadi va avtomatik yopildi (24 soat).\n\n` +
          `📦 ${order.cargoName}\n` +
          `📍 ${order.fromRegion}${fromDistrict} → ${order.toRegion}${toDistrict}\n\n` +
          `Yangi e'lon berish uchun "📦 E'lon berish" tugmasini bosing.`,
      );
    } catch (err) {
      this.logger.warn(
        `Muddati tugagani haqida xabar yuborib bo'lmadi: ${err instanceof Error ? err.message : err}`,
      );
    }

    this.logger.log(`E'lon muddati tugadi: ${orderId}`);
  }
}
