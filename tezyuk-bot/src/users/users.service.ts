import { Injectable, NotFoundException } from '@nestjs/common';
import { Language, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { normalizeText } from 'src/common/utils/formatter.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  async createOrUpdateByTelegram(input: {
    telegramId: bigint;
    fullName: string;
    phone: string;
    language?: Language;
  }): Promise<User> {
    const existing = await this.findByTelegramId(input.telegramId);

    return this.prisma.user.upsert({
      where: { telegramId: input.telegramId },
      create: {
        telegramId: input.telegramId,
        fullName: normalizeText(input.fullName),
        phone: input.phone,
        language: input.language ?? Language.uz,
      },
      update: {
        fullName: normalizeText(input.fullName),
        phone: input.phone,
        language: input.language ?? existing?.language ?? Language.uz,
      },
    });
  }

  async list(page: number, limit: number): Promise<{ items: User[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return { items, total };
  }

  async toggleBlock(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isBlocked: !user.isBlocked },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async ensureExists(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return user;
  }

  async updateLanguage(id: string, language: Language): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { language },
    });
  }
}
