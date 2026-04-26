import { Order, Region, User } from '@prisma/client';

export const normalizeText = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

export const normalizeRegionKey = (value: string): string =>
  normalizeText(value).toLowerCase();

export const containsNumber = (value: string): boolean => /\d/.test(value);

export const formatTime = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const escapeMarkdown = (value: string): string =>
  value.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');

export const formatAnnouncement = (
  order: Order & { user: User },
  fromRegion: Region,
  toRegion: Region | null,
): string => {
  const fromKey = fromRegion.key.replace(/[^a-z0-9_]/gi, '');
  const toKey = (toRegion?.key ?? order.toRegion).replace(/[^a-z0-9_]/gi, '');

  return [
    '🚛 *YANGI YUK BUYURTMASI*',
    '',
    `📦 *Yuk:* ${escapeMarkdown(order.cargoName)}`,
    `📍 *Qayerdan:* ${escapeMarkdown(fromRegion.nameUz)}`,
    `📍 *Qayerga:* ${escapeMarkdown(toRegion?.nameUz ?? order.toRegion)}`,
    `⚖️ *Og'irlik:* ${escapeMarkdown(order.weight)}`,
    `🚚 *Mashina:* ${escapeMarkdown(order.truckType)}`,
    `💰 *Narx:* ${escapeMarkdown(order.price || 'Kelishiladi')}`,
    `📞 *Mijoz:* ${escapeMarkdown(order.user.phone)}`,
    '',
    `⏰ ${escapeMarkdown(formatTime(order.createdAt))} da yuborildi`,
    '',
    `#yuk #${fromKey} #${toKey}`,
  ].join('\n');
};
