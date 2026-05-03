import { Markup } from 'telegraf';

export const truckTypes = [
  { emoji: '🚐', label: 'Labo',          dims: '2.15 × 1.15 × 1.35 м' },
  { emoji: '🚐', label: 'Bongo',         dims: '2.85 × 1.75 × 1.7 м'  },
  { emoji: '📦', label: 'Furgon',        dims: '3.4 × 1.65 × 1.9 м'   },
  { emoji: '🚚', label: 'ISUZU 5',       dims: '4.8 × 2.05 × 1.92 м'  },
  { emoji: '🚚', label: 'ISUZU 10',      dims: '6.9 × 2.4 × 2 м'      },
  { emoji: '🚛', label: 'Yuk mashinasi', dims: '8 × 2.4 × 2.6 м'      },
  { emoji: '🚛', label: 'Fura',          dims: '13.6 × 2.45 × 2.7 м'  },
];

export const truckCatalogText = (): string =>
  '🚛 *Mashina turini tanlang:*\n\n' +
  truckTypes
    .map((t) => `${t.emoji} *${t.label}* — _${t.dims}_`)
    .join('\n') +
  '\n\n_(o\'lchamlar: uzunlik × kenglik × balandlik)_';

export const truckKeyboard = () =>
  Markup.inlineKeyboard([
    ...chunk(
      truckTypes.map((t) =>
        Markup.button.callback(`${t.emoji} ${t.label}`, `truck:${t.label}`),
      ),
      2,
    ),
    [Markup.button.callback('❌ Transport turi muhim emas', 'truck:muhim_emas')],
    [Markup.button.callback('🚫 Bekor qilish', 'cancel:scene')],
  ]);

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}
