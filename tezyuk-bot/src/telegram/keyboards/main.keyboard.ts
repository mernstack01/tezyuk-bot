import { Markup } from 'telegraf';

export const mainKeyboard = () =>
  Markup.keyboard([
    ['📦 E\'lon berish'],
    ['📋 Mening e\'lonlarim', '📞 Bog\'lanish'],
    ["🌐 Tilni o'zgartirish", '❓ Yordam'],
  ]).resize();
