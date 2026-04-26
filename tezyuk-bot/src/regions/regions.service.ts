import { Injectable, NotFoundException } from '@nestjs/common';
import { Region } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { normalizeRegionKey, normalizeText } from 'src/common/utils/formatter.util';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveRegions(): Promise<Region[]> {
    return this.prisma.region.findMany({
      where: { isActive: true },
      orderBy: { nameUz: 'asc' },
    });
  }

  async findByKey(key: string): Promise<Region | null> {
    return this.prisma.region.findUnique({
      where: { key: normalizeRegionKey(key) },
    });
  }

  async listAll(): Promise<Region[]> {
    return this.prisma.region.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async createRegion(input: {
    key: string;
    nameUz: string;
    topicId: number;
    isActive?: boolean;
  }): Promise<Region> {
    return this.prisma.region.create({
      data: {
        key: normalizeRegionKey(input.key),
        nameUz: normalizeText(input.nameUz),
        topicId: input.topicId,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateRegion(
    id: number,
    input: { nameUz?: string; topicId?: number; isActive?: boolean },
  ): Promise<Region> {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) {
      throw new NotFoundException('Hudud topilmadi');
    }

    return this.prisma.region.update({
      where: { id },
      data: {
        ...(input.nameUz ? { nameUz: normalizeText(input.nameUz) } : {}),
        ...(input.topicId !== undefined ? { topicId: input.topicId } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }
}
