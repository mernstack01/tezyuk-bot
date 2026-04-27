import { Language } from '@prisma/client';
import { Markup, Scenes } from 'telegraf';
import { normalizeText } from 'src/common/utils/formatter.util';
import { UsersService } from 'src/users/users.service';
import { mainKeyboard } from '../keyboards/main.keyboard';

interface RegisterState {
  fullName?: string;
}

export const createRegisterScene = (usersService: UsersService) => {
  const scene = new Scenes.WizardScene<Scenes.WizardContext>(
    'register',
    async (ctx) => {
      await ctx.reply("👤 Ismingizni kiriting (ism va familiya):");
      return ctx.wizard.next();
    },
    async (ctx) => {
      const message = ctx.message;
      const fullName =
        message && 'text' in message ? normalizeText(message.text) : '';
      if (fullName.length < 3) {
        await ctx.reply(`Ism kamida 3 ta belgidan iborat bo’lsin`);
        return;
      }

      (ctx.wizard.state as RegisterState).fullName = fullName;
      await ctx.reply(
        'Telefon raqamingizni yuboring',
        Markup.keyboard([
          [Markup.button.contactRequest('📱 Telefon yuborish')],
        ]).resize(),
      );
      return ctx.wizard.next();
    },
    async (ctx) => {
      const state = ctx.wizard.state as RegisterState;
      const message = ctx.message;
      const phone =
        message && 'contact' in message ? message.contact.phone_number : undefined;

      if (!ctx.from || !phone || !state.fullName) {
        await ctx.reply('Telefon tugmasini bosib yuboring');
        return;
      }

      await usersService.createOrUpdateByTelegram({
        telegramId: BigInt(ctx.from.id),
        fullName: state.fullName,
        phone,
        language: Language.uz,
      });

      await ctx.reply(
        "✅ *Ro'yxatdan o'tish yakunlandi!*\n\nEndi e'lon berishingiz mumkin.",
        { parse_mode: 'Markdown', ...mainKeyboard() },
      );
      await ctx.scene.leave();
    },
  );

  scene.command('cancel', async (ctx) => {
    await ctx.reply("❌ Ro'yxatdan o'tish bekor qilindi.", mainKeyboard());
    await ctx.scene.leave();
  });

  return scene;
};
