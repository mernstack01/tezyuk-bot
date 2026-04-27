import { Markup, Scenes } from 'telegraf';
import {
  containsNumber,
  normalizeText,
} from 'src/common/utils/formatter.util';
import { OrdersService } from 'src/orders/orders.service';
import { RegionsService } from 'src/regions/regions.service';
import { UsersService } from 'src/users/users.service';
import { mainKeyboard } from '../keyboards/main.keyboard';
import { regionKeyboard } from '../keyboards/region.keyboard';
import { truckKeyboard } from '../keyboards/truck.keyboard';

interface OrderState {
  fromRegion?: string;
  fromRegionName?: string;
  fromDistrict?: string;
  toRegion?: string;
  toRegionName?: string;
  toDistrict?: string;
  cargoName?: string;
  weight?: string;
  truckType?: string;
  price?: string;
}

const cancelKeyboard = () =>
  Markup.keyboard([['❌ Bekor qilish']]).resize();

export const createOrderScene = (
  ordersService: OrdersService,
  usersService: UsersService,
  regionsService: RegionsService,
) => {
  const scene = new Scenes.WizardScene<Scenes.WizardContext>(
    'order',

    // Step 0: from viloyat tanlash
    async (ctx) => {
      const regions = await regionsService.getActiveRegions();
      await ctx.reply('Yuk qayerdan ketadi? (viloyatni tanlang)', regionKeyboard(regions, 'from'));
      return ctx.wizard.next();
    },

    // Step 1: from viloyat qabul qilish → from tuman so'rash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const callbackQuery = ctx.callbackQuery;
      const data =
        callbackQuery && 'data' in callbackQuery ? callbackQuery.data : undefined;

      if (!data?.startsWith('from:')) {
        await ctx.reply('Hududni tugma orqali tanlang');
        return;
      }

      await ctx.answerCbQuery();
      const fromKey = data.split(':')[1];
      const regions = await regionsService.getActiveRegions();
      const fromRegion = regions.find((r) => r.key === fromKey);
      state.fromRegion = fromKey;
      state.fromRegionName = fromRegion?.nameUz ?? fromKey;

      await ctx.reply(
        `📍 Qaysi tumanidan? (masalan: Yunusobod, Olmazor)\n\nYoki "—" yozing`,
        cancelKeyboard(),
      );
      return ctx.wizard.next();
    },

    // Step 2: from tuman qabul qilish → to viloyat tanlash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const text = message && 'text' in message ? normalizeText(message.text) : '';

      if (text.length < 1) {
        await ctx.reply('Tuman nomini kiriting yoki "—" yozing');
        return;
      }

      state.fromDistrict = text === '—' ? '' : text;

      const regions = await regionsService.getActiveRegions();
      await ctx.reply('Yuk qayerga ketadi? (viloyatni tanlang)', regionKeyboard(regions, 'to'));
      return ctx.wizard.next();
    },

    // Step 3: to viloyat qabul qilish → to tuman so'rash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const callbackQuery = ctx.callbackQuery;
      const data =
        callbackQuery && 'data' in callbackQuery ? callbackQuery.data : undefined;

      if (!data?.startsWith('to:')) {
        await ctx.reply('Hududni tugma orqali tanlang');
        return;
      }

      const toKey = data.split(':')[1];
      if (toKey === state.fromRegion) {
        await ctx.answerCbQuery();
        await ctx.reply("Jo'nash va borish viloyati bir xil bo'lmasin");
        return;
      }

      await ctx.answerCbQuery();
      const toRegion = await regionsService.findByKey(toKey);
      state.toRegion = toKey;
      state.toRegionName = toRegion?.nameUz ?? toKey;

      await ctx.reply(
        `📍 Qaysi tumaniga? (masalan: Mirzo Ulug'bek)\n\nYoki "—" yozing`,
        cancelKeyboard(),
      );
      return ctx.wizard.next();
    },

    // Step 4: to tuman qabul qilish → yuk nomi so'rash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const text = message && 'text' in message ? normalizeText(message.text) : '';

      if (text.length < 1) {
        await ctx.reply('Tuman nomini kiriting yoki "—" yozing');
        return;
      }

      state.toDistrict = text === '—' ? '' : text;

      await ctx.reply('Yuk nomi va tavsifi?', cancelKeyboard());
      return ctx.wizard.next();
    },

    // Step 5: yuk nomi qabul qilish → og'irlik so'rash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const cargoName =
        message && 'text' in message ? normalizeText(message.text) : '';
      if (cargoName.length < 3) {
        await ctx.reply("Yuk tavsifi kamida 3 ta belgidan iborat bo'lsin");
        return;
      }

      state.cargoName = cargoName;
      await ctx.reply("Og'irligi? (masalan: 5 tonna)", cancelKeyboard());
      return ctx.wizard.next();
    },

    // Step 6: og'irlik qabul qilish → narx so'rash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const weight =
        message && 'text' in message ? normalizeText(message.text) : '';
      if (!containsNumber(weight)) {
        await ctx.reply("Og'irlikda raqam bo'lishi kerak");
        return;
      }

      state.weight = weight;
      await ctx.reply("Narx? (masalan: 500 000 so'm yoki \"Kelishamiz\")", cancelKeyboard());
      return ctx.wizard.next();
    },

    // Step 7: narx qabul qilish → mashina turi so'rash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const price =
        message && 'text' in message ? normalizeText(message.text) : '';
      if (price.length < 1) {
        await ctx.reply('Narxni kiriting');
        return;
      }

      state.price = price;
      await ctx.reply('Mashina turi?', truckKeyboard());
      return ctx.wizard.next();
    },

    // Step 8: mashina turi qabul qilish → preview ko'rsatish
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const callbackQuery = ctx.callbackQuery;
      const data =
        callbackQuery && 'data' in callbackQuery ? callbackQuery.data : undefined;

      if (!data?.startsWith('truck:')) {
        await ctx.reply('Mashina turini tugma orqali tanlang');
        return;
      }

      await ctx.answerCbQuery();
      state.truckType = data.split(':')[1];

      const fromLocation = state.fromDistrict
        ? `${state.fromRegionName ?? ''}, ${state.fromDistrict}`
        : (state.fromRegionName ?? '');
      const toLocation = state.toDistrict
        ? `${state.toRegionName ?? ''}, ${state.toDistrict}`
        : (state.toRegionName ?? '');

      await ctx.reply(
        [
          "📋 Buyurtma ma'lumotlari:",
          '',
          `📦 Yuk: ${state.cargoName ?? ''}`,
          `📍 Qayerdan: ${fromLocation}`,
          `📍 Qayerga: ${toLocation}`,
          `⚖️ Og'irlik: ${state.weight ?? ''}`,
          `🚚 Mashina: ${state.truckType ?? ''}`,
          `💰 Narx: ${state.price ?? ''}`,
        ].join('\n'),
        Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Tasdiqlash', 'confirm:yes'),
            Markup.button.callback('❌ Bekor qilish', 'confirm:no'),
          ],
        ]),
      );
      return ctx.wizard.next();
    },

    // Step 9: tasdiqlash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const callbackQuery = ctx.callbackQuery;
      const data =
        callbackQuery && 'data' in callbackQuery ? callbackQuery.data : undefined;

      if (!data?.startsWith('confirm:')) {
        await ctx.reply('Tugmalardan birini tanlang');
        return;
      }

      await ctx.answerCbQuery();

      if (data === 'confirm:no') {
        await ctx.reply("❌ E'lon bekor qilindi", mainKeyboard());
        await ctx.scene.leave();
        return;
      }

      if (!ctx.from) {
        await ctx.reply(`Xatolik yuz berdi, qayta urinib ko'ring`, mainKeyboard());
        await ctx.scene.leave();
        return;
      }

      const user = await usersService.findByTelegramId(BigInt(ctx.from.id));
      if (!user) {
        await ctx.reply("Avval ro'yxatdan o'ting", mainKeyboard());
        await ctx.scene.leave();
        return;
      }

      try {
        await ordersService.createOrder({
          userId: user.id,
          fromRegion: state.fromRegion ?? '',
          fromDistrict: state.fromDistrict ?? '',
          toRegion: state.toRegion ?? '',
          toDistrict: state.toDistrict ?? '',
          cargoName: state.cargoName ?? '',
          weight: state.weight ?? '',
          truckType: state.truckType ?? '',
          price: state.price ?? '',
        });
        await ctx.reply(
          "✅ *E'loningiz qabul qilindi!*\n\nHaydovchilar siz bilan bog'lanishadi.",
          { parse_mode: 'Markdown', ...mainKeyboard() },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : `Xatolik yuz berdi`;
        await ctx.reply(message, mainKeyboard());
      }

      await ctx.scene.leave();
    },
  );

  scene.hears('❌ Bekor qilish', async (ctx) => {
    await ctx.reply("❌ E'lon berish bekor qilindi", mainKeyboard());
    await ctx.scene.leave();
  });

  scene.command('cancel', async (ctx) => {
    await ctx.reply("❌ E'lon berish bekor qilindi", mainKeyboard());
    await ctx.scene.leave();
  });

  scene.action('cancel:scene', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("❌ E'lon berish bekor qilindi", mainKeyboard());
    await ctx.scene.leave();
  });

  return scene;
};
