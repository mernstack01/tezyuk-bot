import { Region } from '@prisma/client';
import { Markup } from 'telegraf';

export const regionKeyboard = (regions: Region[], prefix: string) => {
  const buttons = regions.map((region) =>
    Markup.button.callback(region.nameUz, `${prefix}:${region.key}`),
  );

  return Markup.inlineKeyboard(buttons, { columns: 2 });
};
