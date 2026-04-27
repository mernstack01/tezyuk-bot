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

  const fromDistrict = order.fromDistrict
    ? `, ${escapeMarkdown(order.fromDistrict)}`
    : '';
  const toDistrict = order.toDistrict
    ? `, ${escapeMarkdown(order.toDistrict)}`
    : '';

  const fromLocation = `${escapeMarkdown(fromRegion.nameUz)}${fromDistrict}`;
  const toLocation = `${escapeMarkdown(toRegion?.nameUz ?? order.toRegion)}${toDistrict}`;

  // Normalize phone: ensure it starts with +
  const rawPhone = order.user.phone.startsWith('+')
    ? order.user.phone
    : `+${order.user.phone}`;
  const phoneLink = `[${rawPhone}](tel:${rawPhone})`;

  return [
    '🚛 *YANGI YUK BUYURTMASI*',
    '',
    `📦 *Yuk:* ${escapeMarkdown(order.cargoName)}`,
    `📍 *Qayerdan:* ${fromLocation}`,
    `📍 *Qayerga:* ${toLocation}`,
    `⚖️ *Og'irlik:* ${escapeMarkdown(order.weight)}`,
    `🚚 *Mashina:* ${escapeMarkdown(order.truckType)}`,
    `💰 *Narx:* ${escapeMarkdown(order.price || 'Kelishiladi')}`,
    `📞 *Mijoz:* ${phoneLink}`,
    '',
    `⏰ ${escapeMarkdown(formatTime(order.createdAt))} da yuborildi`,
    '',
    `#yuk #${fromKey} #${toKey}`,
  ].join('\n');
};
