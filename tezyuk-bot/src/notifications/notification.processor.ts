import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
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
    const order = await this.prisma.order.findUnique({
      where: { id: job.data.orderId },
      include: { user: true },
    });

    if (!order) {
      this.logger.warn(`Buyurtma topilmadi: ${job.data.orderId}`);
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

    // 1. Elonlar (umumiy) topiciga yuborish
    try {
      const announcementMsg = await this.bot.telegram.sendMessage(
        groupId,
        text,
        {
          parse_mode: parseMode,
          message_thread_id: announcementTopicId,
        },
      );
      sentMessageId = announcementMsg.message_id;
    } catch (err) {
      this.logger.warn(
        `Elonlar topiciga yuborib bo'lmadi (id=${announcementTopicId}): ${err instanceof Error ? err.message : err}`,
      );
    }

    // 2. Viloyat topiciga yuborish (agar Elonlar topicidan farqli bo'lsa)
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
      where: { id: order.id },
      data: { telegramMessageId: sentMessageId },
    });

    this.logger.log(`Telegram e'loni yuborildi: ${order.id}`);
  }
}
