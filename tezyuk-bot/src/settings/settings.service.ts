import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, dailyOrderLimit: 12 },
      update: {},
    });
  }

  async updateDailyLimit(limit: number) {
    return this.prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, dailyOrderLimit: limit },
      update: { dailyOrderLimit: limit },
    });
  }

  async getDailyLimit(): Promise<number> {
    const settings = await this.getSettings();
    return settings.dailyOrderLimit;
  }
}
