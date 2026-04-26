import { Region } from '@prisma/client';
import { Markup } from 'telegraf';

export const regionKeyboard = (regions: Region[], prefix: string) => {
  const buttons = regions.map((region) =>
    Markup.button.callback(region.nameUz, `${prefix}:${region.key}`),
  );

  return Markup.inlineKeyboard([
    ...chunk(buttons, 2),
    [Markup.button.callback('❌ Bekor qilish', 'cancel:scene')],
  ]);
};

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}
