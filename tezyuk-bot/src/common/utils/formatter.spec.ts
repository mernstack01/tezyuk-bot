import { formatAnnouncement, normalizeText, containsNumber } from './formatter.util';
import { Order, Region, User, Language, OrderStatus } from '@prisma/client';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  telegramId: BigInt(123456789),
  phone: '+998901234567',
  fullName: 'Test User',
  language: Language.uz,
  isBlocked: false,
  dailyOrderLimit: null,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides,
});

const makeOrder = (overrides: Partial<Order & { user: User }> = {}): Order & { user: User } => ({
  id: 'order-1',
  userId: 'user-1',
  fromRegion: 'tashkent',
  fromDistrict: '',
  toRegion: 'samarkand',
  toDistrict: '',
  cargoName: 'Mebel',
  weight: '2 tonna',
  truckType: 'Tentli',
  price: '500 000',
  contactPhone: null,
  extraInfo: null,
  status: OrderStatus.active,
  telegramMessageId: null,
  createdAt: new Date('2024-01-01T10:30:00Z'),
  updatedAt: new Date('2024-01-01T10:30:00Z'),
  user: makeUser(),
  ...overrides,
});

const makeRegion = (key: string, nameUz: string, topicId = 1): Region => ({
  id: 1,
  key,
  nameUz,
  topicId,
  isActive: true,
});

describe('formatAnnouncement', () => {
  it('telefon raqamini clickable link formatida ko\'rsatadi', () => {
    const order = makeOrder();
    const result = formatAnnouncement(order, makeRegion('tashkent', 'Toshkent'), makeRegion('samarkand', 'Samarqand'));
    expect(result).toContain('[+998901234567](tel:+998901234567)');
  });

  it('telefon raqamiga + qo\'shadi agar yo\'q bo\'lsa', () => {
    const order = makeOrder({ user: makeUser({ phone: '998901234567' }) });
    const result = formatAnnouncement(order, makeRegion('tashkent', 'Toshkent'), null);
    expect(result).toContain('[+998901234567](tel:+998901234567)');
  });

  it('fromDistrict ko\'rsatadi', () => {
    const order = makeOrder({ fromDistrict: 'Yunusobod' });
    const result = formatAnnouncement(order, makeRegion('tashkent', 'Toshkent'), makeRegion('samarkand', 'Samarqand'));
    expect(result).toContain('Yunusobod');
    expect(result).toContain('Toshkent, Yunusobod');
  });

  it('toDistrict ko\'rsatadi', () => {
    const order = makeOrder({ toDistrict: 'Urgut' });
    const result = formatAnnouncement(order, makeRegion('tashkent', 'Toshkent'), makeRegion('samarkand', 'Samarqand'));
    expect(result).toContain('Samarqand, Urgut');
  });

  it('toRegion null bo\'lganda fallback ishlatadi', () => {
    const order = makeOrder();
    const result = formatAnnouncement(order, makeRegion('tashkent', 'Toshkent'), null);
    expect(result).toContain('samarkand');
  });

  it('hashtag larni to\'g\'ri shakllantiradi', () => {
    const order = makeOrder();
    const result = formatAnnouncement(order, makeRegion('tashkent', 'Toshkent'), makeRegion('samarkand', 'Samarqand'));
    expect(result).toContain('#yuk #tashkent #samarkand');
  });
});

describe('normalizeText', () => {
  it('bosh va oxiridagi bo\'shliqlarni olib tashlaydi', () => {
    expect(normalizeText('  salom  ')).toBe('salom');
  });

  it('bir nechta bo\'shliqlarni bittaga almashtiradi', () => {
    expect(normalizeText('salom   dunyo')).toBe('salom dunyo');
  });
});

describe('containsNumber', () => {
  it('raqam bo\'lsa true qaytaradi', () => {
    expect(containsNumber('5 tonna')).toBe(true);
    expect(containsNumber('100')).toBe(true);
  });

  it('raqam bo\'lmasa false qaytaradi', () => {
    expect(containsNumber('tonna')).toBe(false);
    expect(containsNumber('')).toBe(false);
  });
});
