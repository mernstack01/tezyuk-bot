import { Markup } from 'telegraf';

const truckTypes = [
  { emoji: '🚛', label: 'Tentli' },
  { emoji: '📦', label: "Yopiq furgon" },
  { emoji: '🏗️', label: 'Ochiq platforma' },
  { emoji: '❄️', label: 'Muzlatgich' },
  { emoji: '🛢️', label: 'Sisterna' },
  { emoji: '🔧', label: 'Boshqa' },
];

export const truckKeyboard = () =>
  Markup.inlineKeyboard([
    ...chunk(
      truckTypes.map((item) =>
        Markup.button.callback(`${item.emoji} ${item.label}`, `truck:${item.label}`),
      ),
      2,
    ),
    [Markup.button.callback('❌ Bekor qilish', 'cancel:scene')],
  ]);

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}
