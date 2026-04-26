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
  Markup.inlineKeyboard(
    truckTypes.map((item) =>
      Markup.button.callback(
        `${item.emoji} ${item.label}`,
        `truck:${item.label}`,
      ),
    ),
    { columns: 2 },
  );
