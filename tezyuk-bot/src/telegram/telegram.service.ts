import { Injectable, OnModuleInit, UseGuards } from '@nestjs/common';
import { Language } from '@prisma/client';
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { mainKeyboard } from './keyboards/main.keyboard';
import { RegisteredGuard } from './guards/registered.guard';

type BotContext = Scenes.WizardContext;

const CONTACT_TEXT = `📞 Bog'lanish uchun:\n\nSavollar va takliflar uchun admin bilan bog'laning.`;

const HELP_TEXT =
  `❓ *Yordam*\n\n` +
  `📦 *E'lon berish* — yuk tashish uchun e'lon joylashtiring\n` +
  `📋 *Mening e'lonlarim* — oxirgi 10 ta e'loningiz\n` +
  `🌐 *Tilni o'zgartirish* — UZ / RU\n\n` +
  `⚠️ Kuniga 5 tadan ko'p e'lon joylashtirib bo'lmaydi\n` +
  `⏰ E'lonlar 24 soatdan keyin avtomatik yopiladi`;

@Injectable()
@Update()
export class TelegramService implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  async onModuleInit() {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: '🏠 Bosh sahifa' },
      { command: 'order', description: "📦 Yangi yuk e'loni berish" },
      { command: 'myorders', description: "📋 Mening e'lonlarim" },
      { command: 'help', description: '❓ Yordam' },
    ]);
  }

  @Start()
  async start(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.chat?.type !== 'private') return;

    const user = await this.usersService.findByTelegramId(BigInt(ctx.from.id));
    if (!user) {
      await ctx.reply(
        `👋 Assalomu alaykum! YukBor botiga xush kelibsiz.\n\nRo'yxatdan o'tish uchun ismingizni kiriting:`,
      );
      await ctx.scene.enter('register');
      return;
    }

    if (user.isBlocked) {
      await ctx.reply("🚫 Hisobingiz bloklangan. Murojaat uchun admin bilan bog'laning.");
      return;
    }

    await ctx.reply(`👋 Xush kelibsiz, *${user.fullName}*!`, {
      ...mainKeyboard(),
      parse_mode: 'Markdown',
    });
  }

  @Command('order')
  @Hears("📦 E'lon berish")
  @UseGuards(RegisteredGuard)
  async order(@Ctx() ctx: BotContext) {
    await ctx.scene.enter('order');
  }

  @Command('myorders')
  @Hears("📋 Mening e'lonlarim")
  @UseGuards(RegisteredGuard)
  async myOrders(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const user = await this.usersService.findByTelegramId(BigInt(ctx.from.id));
    if (!user) {
      await ctx.scene.enter('register');
      return;
    }

    const orders = await this.ordersService.listForUser(user.id);
    if (!orders.length) {
      await ctx.reply(
        "📋 Sizda hali e'lonlar yo'q\n\n📦 E'lon berish tugmasini bosing!",
        mainKeyboard(),
      );
      return;
    }

    const statusIcon: Record<string, string> = {
      pending: '🟡',
      active: '🟢',
      cancelled: '🔴',
      completed: '✅',
      expired: '⏰',
    };

    const recent = orders.slice(0, 10);

    const text = recent
      .map((order, i) => {
        const fromLocation = order.fromDistrict
          ? `${order.fromRegion}, ${order.fromDistrict}`
          : order.fromRegion;
        const toLocation = order.toDistrict
          ? `${order.toRegion}, ${order.toDistrict}`
          : order.toRegion;
        return (
          `${i + 1}. ${statusIcon[order.status] ?? '⚪'} ${fromLocation} → ${toLocation}\n` +
          `   ${order.cargoName} | ${order.weight}\n` +
          `   💰 ${order.price || 'Kelishiladi'}`
        );
      })
      .join('\n\n');

    const actionButtons = recent
      .flatMap((order, i) => {
        if (order.status !== 'active') return [];
        return [
          [
            Markup.button.callback(`✅ ${i + 1} — Topildim`, `completeorder:${order.id}`),
            Markup.button.callback(`❌ ${i + 1} — Bekor`, `cancelorder:${order.id}`),
          ],
        ];
      });

    const replyOptions = actionButtons.length
      ? { parse_mode: 'Markdown' as const, ...Markup.inlineKeyboard(actionButtons) }
      : { parse_mode: 'Markdown' as const, ...mainKeyboard() };

    await ctx.reply(`📋 *Mening e'lonlarim:*\n\n${text}`, replyOptions);
  }

  @Action(/^cancelorder:/)
  async cancelMyOrder(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const data =
      ctx.callbackQuery && 'data' in ctx.callbackQuery
        ? ctx.callbackQuery.data
        : '';
    const orderId = data.replace('cancelorder:', '');

    if (!ctx.from) return;

    try {
      const order = await this.ordersService.findById(orderId);
      const user = await this.usersService.findByTelegramId(BigInt(ctx.from.id));

      if (!user || order.userId !== user.id) {
        await ctx.reply("⚠️ Bu e'lon sizga tegishli emas.");
        return;
      }

      const cancelled = await this.ordersService.cancelOrder(orderId);

      const groupId = this.configService.get<string>('GROUP_ID', '');
      if (cancelled.telegramMessageId && groupId) {
        try {
          await this.bot.telegram.deleteMessage(groupId, cancelled.telegramMessageId);
        } catch {}
      }

      await ctx.editMessageText("✅ E'lon bekor qilindi", Markup.inlineKeyboard([]));
    } catch {
      await ctx.reply("Xatolik yuz berdi. Qayta urinib ko'ring.");
    }
  }

  @Action(/^completeorder:/)
  async completeMyOrder(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const data =
      ctx.callbackQuery && 'data' in ctx.callbackQuery
        ? ctx.callbackQuery.data
        : '';
    const orderId = data.replace('completeorder:', '');

    if (!ctx.from) return;

    try {
      const order = await this.ordersService.findById(orderId);
      const user = await this.usersService.findByTelegramId(BigInt(ctx.from.id));

      if (!user || order.userId !== user.id) {
        await ctx.reply("⚠️ Bu e'lon sizga tegishli emas.");
        return;
      }

      const completed = await this.ordersService.completeOrder(orderId);

      const groupId = this.configService.get<string>('GROUP_ID', '');
      if (completed.telegramMessageId && groupId) {
        try {
          await this.bot.telegram.deleteMessage(groupId, completed.telegramMessageId);
        } catch {}
      }

      await ctx.editMessageText(
        "✅ E'lon yopildi — haydovchi topildi deb belgilandi",
        Markup.inlineKeyboard([]),
      );
    } catch {
      await ctx.reply("Xatolik yuz berdi. Qayta urinib ko'ring.");
    }
  }

  @Command('help')
  @Hears('❓ Yordam')
  async help(@Ctx() ctx: BotContext) {
    await ctx.reply(HELP_TEXT, { parse_mode: 'Markdown', ...mainKeyboard() });
  }

  @Hears("📞 Bog'lanish")
  async contact(@Ctx() ctx: BotContext) {
    await ctx.reply(CONTACT_TEXT, mainKeyboard());
  }

  @UseGuards(RegisteredGuard)
  @Hears("🌐 Tilni o'zgartirish")
  async changeLanguage(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const user = await this.usersService.findByTelegramId(BigInt(ctx.from.id));
    if (!user) {
      await ctx.scene.enter('register');
      return;
    }

    const language = user.language === Language.uz ? Language.ru : Language.uz;
    await this.usersService.updateLanguage(user.id, language);
    await ctx.reply(
      `🌐 Til o'zgartirildi: *${language === Language.uz ? "O'zbek" : 'Русский'}*`,
      { parse_mode: 'Markdown', ...mainKeyboard() },
    );
  }

  @Command('topicid')
  async topicId(@Ctx() ctx: BotContext) {
    const threadId = (ctx.message as { message_thread_id?: number } | undefined)
      ?.message_thread_id;
    if (threadId) {
      await ctx.reply(`Topic ID: \`${threadId}\``, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('Bu command faqat forum topic ichida ishlaydi.');
    }
  }

  @On('message')
  async onGroupMessage(@Ctx() ctx: BotContext) {
    const chat = ctx.chat;
    const message = ctx.message;
    if (!chat || !message || !message.from) return;
    if (chat.type !== 'supergroup' && chat.type !== 'group') return;
    if (message.from.is_bot) return;

    const threadId = (message as { message_thread_id?: number }).message_thread_id;
    const elonlarTopicId = Number(process.env.ANNOUNCEMENT_TOPIC_ID);
    if (!threadId || threadId !== elonlarTopicId) return;

    try {
      await ctx.deleteMessage();
    } catch {}

    const botUsername = this.bot.botInfo?.username;
    try {
      await ctx.telegram.sendMessage(
        message.from.id,
        `🚫 Elonlar topici faqat e'lonlar uchun.\n\nBuyurtmachi bilan bog'lanish uchun botga yozing:\n👉 @${botUsername}`,
      );
    } catch {}
  }
}
