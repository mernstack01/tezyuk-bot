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
import { truckCatalogText, truckKeyboard } from '../keyboards/truck.keyboard';

interface OrderState {
  isForeign?: boolean;      // UZ → Chet el
  isFromForeign?: boolean;  // Chet el → UZ
  fromRegion?: string;
  fromRegionName?: string;
  fromDistrict?: string;
  toRegion?: string;
  toRegionName?: string;
  toDistrict?: string;
  cargoName?: string;
  weight?: string;
  price?: string;
  extraInfo?: string;
  truckType?: string;
  contactPhone?: string;
}

const cancelKeyboard = () =>
  Markup.keyboard([['❌ Bekor qilish']]).resize();

// Raqam formati: +998XXXXXXXXX yoki 998XXXXXXXXX yoki 8XXXXXXXXXX
const isValidPhone = (value: string): boolean =>
  /^(\+?998\d{9}|8\d{10})$/.test(value.replace(/[\s\-()]/g, ''));

const normalizePhone = (value: string): string => {
  const s = value.replace(/[\s\-()]/g, '');
  return s.startsWith('+') ? s : `+${s}`;
};

export const createOrderScene = (
  ordersService: OrdersService,
  usersService: UsersService,
  regionsService: RegionsService,
) => {
  // Buyurtma yaratish va tasdiqlash xabarini yuborish — qadam 11 va 12 da ishlatiladi
  const finalizeOrder = async (
    ctx: Scenes.WizardContext,
    state: OrderState,
  ): Promise<void> => {
    if (!ctx.from) {
      await ctx.reply("Xatolik yuz berdi, qayta urinib ko'ring", mainKeyboard());
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
      const order = await ordersService.createOrder({
        userId: user.id,
        fromRegion: state.fromRegion ?? '',
        fromDistrict: state.fromDistrict ?? '',
        toRegion: state.toRegion ?? '',
        toDistrict: state.toDistrict ?? '',
        cargoName: state.cargoName ?? '',
        weight: state.weight ?? '',
        truckType: state.truckType ?? '',
        price: state.price ?? '',
        extraInfo: state.extraInfo,
        contactPhone: state.contactPhone,
      });

      // Feature 4: "Topildim" eslatmasi inline keyboard bilan
      await ctx.reply(
        "✅ E'loningiz joylashtirildi!\n\n" +
          "💡 Eslatma: Haydovchi topilganda '✅ Topildim' tugmasini bosing — " +
          "e'lon yopiladi va raqamingiz yashiriladi.",
        Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Topildim', `completeorder:${order.id}`),
            Markup.button.callback("📋 E'lonlarim", 'myorders:show'),
          ],
        ]),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xatolik yuz berdi";
      await ctx.reply(message, mainKeyboard());
    }

    await ctx.scene.leave();
  };

  const scene = new Scenes.WizardScene<Scenes.WizardContext>(
    'order',

    // Qadam 0: Yo'nalish turi tanlash
    async (ctx) => {
      await ctx.reply(
        'Yuk qayerdan qayerga ketadi?',
        Markup.inlineKeyboard([
          [Markup.button.callback("🇺🇿 O'zbekiston ichida", 'dir:uz')],
          [Markup.button.callback("📤 O'zbekistondan → Chet davlatga", 'dir:out')],
          [Markup.button.callback('📥 Chet davlatdan → O\'zbekistonga', 'dir:in')],
          [Markup.button.callback('❌ Bekor qilish', 'cancel:scene')],
        ]),
      );
      return ctx.wizard.next();
    },

    // Qadam 1: Yo'nalish qabul qilish → FROM boshlash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const callbackQuery = ctx.callbackQuery;
      const data =
        callbackQuery && 'data' in callbackQuery ? callbackQuery.data : undefined;

      if (!data || !['dir:uz', 'dir:out', 'dir:in'].includes(data)) {
        await ctx.reply('Tugmalardan birini tanlang');
        return;
      }

      await ctx.answerCbQuery();
      state.isForeign = data === 'dir:out';
      state.isFromForeign = data === 'dir:in';

      if (state.isFromForeign) {
        // Chet el → UZ: FROM davlat nomini so'rash
        state.fromRegion = 'foreign';
        await ctx.reply(
          "🌍 Yuk qaysi davlatdan keladi?\n\nMasalan: Rossiya, Xitoy, Qozog'iston, Turkiya",
          cancelKeyboard(),
        );
        return ctx.wizard.next();
      }

      // UZ ichida yoki UZ → Chet el: FROM viloyatini tanlash
      const regions = (await regionsService.getActiveRegions()).filter(
        (r) => r.key !== 'foreign',
      );
      await ctx.reply('Yuk qayerdan ketadi? (viloyatni tanlang)', regionKeyboard(regions, 'from'));
      return ctx.wizard.next();
    },

    // Qadam 2: isFromForeign → davlat nomi (text) | UZ → from-viloyat (callback)
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;

      if (state.isFromForeign) {
        const message = ctx.message;
        const text = message && 'text' in message ? normalizeText(message.text) : '';

        if (text.length < 2) {
          await ctx.reply('Davlat nomini kiriting');
          return;
        }

        state.fromRegionName = text;
        await ctx.reply(
          '📍 Qaysi shahar yoki viloyatdan?\n\nMasalan: Moskva, Shanxay, Olmaota\n\nYoki "—" yozing',
          cancelKeyboard(),
        );
        return ctx.wizard.next();
      }

      // UZ from: viloyat callback
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

    // Qadam 3: From-shahar/tuman qabul qilish → TO boshlash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const text = message && 'text' in message ? normalizeText(message.text) : '';

      if (text.length < 1) {
        await ctx.reply('Shahar yoki tuman nomini kiriting yoki "—" yozing');
        return;
      }

      if (state.isFromForeign) {
        // Chet el → UZ: fromDistrict = "Davlat, Shahar" (country + city combined)
        const city = text === '—' ? '' : text;
        state.fromDistrict = city
          ? `${state.fromRegionName ?? ''}, ${city}`
          : (state.fromRegionName ?? '');
      } else {
        state.fromDistrict = text === '—' ? '' : text;
      }

      if (state.isForeign) {
        // UZ → Chet el: TO davlat nomini so'rash
        state.toRegion = 'foreign';
        await ctx.reply(
          "🌍 Yuk qaysi davlatga ketadi?\n\nMasalan: Rossiya, Xitoy, Qozog'iston, Turkiya",
          cancelKeyboard(),
        );
        return ctx.wizard.next();
      }

      // UZ ichida yoki Chet el → UZ: TO viloyatini tanlash
      const regions = (await regionsService.getActiveRegions()).filter(
        (r) => r.key !== 'foreign',
      );
      await ctx.reply('Yuk qayerga ketadi? (viloyatni tanlang)', regionKeyboard(regions, 'to'));
      return ctx.wizard.next();
    },

    // Qadam 4: isForeign → TO davlat nomi (text) | UZ → to-viloyat (callback)
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;

      if (state.isForeign) {
        const message = ctx.message;
        const text = message && 'text' in message ? normalizeText(message.text) : '';

        if (text.length < 2) {
          await ctx.reply('Davlat nomini kiriting');
          return;
        }

        state.toRegionName = text;
        await ctx.reply(
          '📍 Qaysi shahar yoki viloyatda?\n\nMasalan: Moskva, Shanxay, Olmaota\n\nYoki "—" yozing',
          cancelKeyboard(),
        );
        return ctx.wizard.next();
      }

      // UZ to: viloyat callback
      const callbackQuery = ctx.callbackQuery;
      const data =
        callbackQuery && 'data' in callbackQuery ? callbackQuery.data : undefined;

      if (!data?.startsWith('to:')) {
        await ctx.reply('Hududni tugma orqali tanlang');
        return;
      }

      const toKey = data.split(':')[1];
      if (!state.isFromForeign && toKey === state.fromRegion) {
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

    // Qadam 5: To-shahar/tuman qabul qilish → yuk nomi so'rash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const text = message && 'text' in message ? normalizeText(message.text) : '';

      if (text.length < 1) {
        await ctx.reply('Shahar yoki tuman nomini kiriting yoki "—" yozing');
        return;
      }

      if (state.isForeign) {
        // UZ → Chet el: toDistrict = "Davlat, Shahar" (country + city combined)
        const city = text === '—' ? '' : text;
        state.toDistrict = city
          ? `${state.toRegionName ?? ''}, ${city}`
          : (state.toRegionName ?? '');
      } else {
        state.toDistrict = text === '—' ? '' : text;
      }

      await ctx.reply('Yuk nomi va tavsifi?', cancelKeyboard());
      return ctx.wizard.next();
    },

    // Qadam 6: Yuk nomi qabul qilish → og'irlik so'rash
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

    // Qadam 7: Og'irlik qabul qilish → narx so'rash
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
      await ctx.reply(
        "Narx? (masalan: 500 000 so'm yoki \"Kelishamiz\")",
        cancelKeyboard(),
      );
      return ctx.wizard.next();
    },

    // Qadam 8: Narx qabul qilish → qo'shimcha ma'lumot so'rash
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
      await ctx.reply(
        "📝 Qo'shimcha ma'lumot? (yuklash vaqti, maxsus talablar, eslatmalar)\n\nYoki o'tkazib yuborish uchun — yozing",
        cancelKeyboard(),
      );
      return ctx.wizard.next();
    },

    // Qadam 9: Qo'shimcha ma'lumot qabul qilish → mashina turi so'rash
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const text =
        message && 'text' in message ? normalizeText(message.text) : '';

      if (text.length < 1) {
        await ctx.reply("Matn kiriting yoki o'tkazib yuborish uchun — yozing");
        return;
      }

      state.extraInfo = text === '—' ? undefined : text;
      await ctx.reply(truckCatalogText(), {
        parse_mode: 'Markdown',
        ...truckKeyboard(),
      });
      return ctx.wizard.next();
    },

    // Qadam 10: Mashina turi qabul qilish → preview ko'rsatish
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

      // Chet el yo'nalishida fromDistrict allaqachon "Davlat, Shahar" ni o'z ichiga oladi
      const fromLocation = state.isFromForeign
        ? (state.fromDistrict ?? state.fromRegionName ?? '')
        : (state.fromDistrict
            ? `${state.fromRegionName ?? ''}, ${state.fromDistrict}`
            : (state.fromRegionName ?? ''));
      const toLocation = state.isForeign
        ? (state.toDistrict ?? state.toRegionName ?? '')
        : (state.toDistrict
            ? `${state.toRegionName ?? ''}, ${state.toDistrict}`
            : (state.toRegionName ?? ''));

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
          ...(state.extraInfo ? [`📝 Qo'shimcha: ${state.extraInfo}`] : []),
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

    // Qadam 11: Tasdiqlash qabul qilish → telefon tanlash
    async (ctx) => {
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
        await ctx.reply("Xatolik yuz berdi, qayta urinib ko'ring", mainKeyboard());
        await ctx.scene.leave();
        return;
      }

      const user = await usersService.findByTelegramId(BigInt(ctx.from.id));
      if (!user) {
        await ctx.reply("Avval ro'yxatdan o'ting", mainKeyboard());
        await ctx.scene.leave();
        return;
      }

      const rawPhone = user.phone.startsWith('+') ? user.phone : `+${user.phone}`;

      await ctx.reply(
        "Telefon raqamingiz qanday ko'rinsin?",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(`✅ Profildan: ${rawPhone}`, 'phone:profile'),
            Markup.button.callback('📝 Boshqa raqam', 'phone:custom'),
          ],
        ]),
      );
      return ctx.wizard.next();
    },

    // Qadam 11: Telefon tanlash qabul qilish
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const callbackQuery = ctx.callbackQuery;
      const data =
        callbackQuery && 'data' in callbackQuery ? callbackQuery.data : undefined;

      if (!data || !data.startsWith('phone:')) {
        await ctx.reply('Tugmalardan birini tanlang');
        return;
      }

      await ctx.answerCbQuery();

      if (data === 'phone:profile') {
        if (!ctx.from) {
          await ctx.reply("Xatolik yuz berdi", mainKeyboard());
          await ctx.scene.leave();
          return;
        }
        const user = await usersService.findByTelegramId(BigInt(ctx.from.id));
        if (!user) {
          await ctx.reply("Avval ro'yxatdan o'ting", mainKeyboard());
          await ctx.scene.leave();
          return;
        }
        state.contactPhone = user.phone;
        // Inline tugmani o'chirib, yakunlash
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        await finalizeOrder(ctx, state);
        return;
      }

      // phone:custom — yangi raqam kiritish so'raladi
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      await ctx.reply(
        'Telefon raqamingizni kiriting:\n\nFormat: +998XXXXXXXXX yoki 998XXXXXXXXX',
        cancelKeyboard(),
      );
      return ctx.wizard.next();
    },

    // Qadam 12: Maxsus telefon raqam qabul qilish → buyurtma yaratish
    async (ctx) => {
      const state = ctx.wizard.state as OrderState;
      const message = ctx.message;
      const text = message && 'text' in message ? message.text.trim() : '';

      if (!isValidPhone(text)) {
        await ctx.reply(
          "❌ Noto'g'ri format.\n\nMisol: +998901234567 yoki 998901234567",
          cancelKeyboard(),
        );
        return;
      }

      state.contactPhone = normalizePhone(text);
      await finalizeOrder(ctx, state);
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
