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
  options: { hidePhone?: boolean; completed?: boolean } = {},
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

  // contactPhone ustunlik qiladi, yo'q bo'lsa user.phone ishlatiladi
  const phoneSource = order.contactPhone ?? order.user.phone;
  const rawPhone = phoneSource.startsWith('+') ? phoneSource : `+${phoneSource}`;
  const phoneDisplay = options.hidePhone
    ? '🔒 Yashirilgan'
    : `[${rawPhone}](tel:${rawPhone})`;

  // Yopilgan e'lonlarda YOPILDI badge qo'shiladi
  const header = options.completed
    ? '✅ *YOPILDI* — 🚛 *YUK BUYURTMASI*'
    : '🚛 *YANGI YUK BUYURTMASI*';

  return [
    header,
    '',
    `📦 *Yuk:* ${escapeMarkdown(order.cargoName)}`,
    `📍 *Qayerdan:* ${fromLocation}`,
    `📍 *Qayerga:* ${toLocation}`,
    `⚖️ *Og'irlik:* ${escapeMarkdown(order.weight)}`,
    `🚚 *Mashina:* ${escapeMarkdown(order.truckType)}`,
    `💰 *Narx:* ${escapeMarkdown(order.price || 'Kelishiladi')}`,
    ...(order.extraInfo ? [`📝 *Qo'shimcha:* ${escapeMarkdown(order.extraInfo)}`] : []),
    `📞 *Mijoz:* ${phoneDisplay}`,
    '',
    `⏰ ${escapeMarkdown(formatTime(order.createdAt))} da yuborildi`,
    '',
    `#yuk #${fromKey} #${toKey}`,
  ].join('\n');
};
