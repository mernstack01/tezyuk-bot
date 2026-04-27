import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  containsNumber,
  normalizeRegionKey,
  normalizeText,
} from 'src/common/utils/formatter.util';
import { NotificationProducer } from 'src/notifications/notification.producer';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationProducer: NotificationProducer,
  ) {}

  async createOrder(input: {
    userId: string;
    fromRegion: string;
    fromDistrict: string;
    toRegion: string;
    toDistrict: string;
    cargoName: string;
    weight: string;
    truckType: string;
    price: string;
  }): Promise<Order> {
    const count = await this.prisma.order.count({
      where: {
        userId: input.userId,
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
    });

    if (count >= 5) {
      throw new BadRequestException('Kunlik limit 5 ta buyurtma');
    }

    if (!containsNumber(input.weight)) {
      throw new BadRequestException("Og'irlik raqam bilan kiritilishi kerak");
    }

    const order = await this.prisma.order.create({
      data: {
        userId: input.userId,
        fromRegion: normalizeRegionKey(input.fromRegion),
        fromDistrict: normalizeText(input.fromDistrict),
        toRegion: normalizeRegionKey(input.toRegion),
        toDistrict: normalizeText(input.toDistrict),
        cargoName: normalizeText(input.cargoName),
        weight: normalizeText(input.weight),
        truckType: normalizeText(input.truckType),
        price: normalizeText(input.price),
        status: OrderStatus.active,
      },
    });

    await this.notificationProducer.addNotificationJob(order.id);
    await this.notificationProducer.addExpiryJob(order.id, 24 * 60 * 60 * 1000);
    return order;
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    return order;
  }

  async listForAdmin(params: {
    status?: OrderStatus;
    region?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.OrderWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.region ? { fromRegion: normalizeRegionKey(params.region) } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total };
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await this.findById(id);

    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async updateOrder(
    id: string,
    data: { status?: OrderStatus; telegramMessageId?: number },
  ): Promise<Order> {
    await this.findById(id);

    return this.prisma.order.update({
      where: { id },
      data,
    });
  }

  async cancelOrder(id: string): Promise<Order> {
    return this.updateStatus(id, OrderStatus.cancelled);
  }

  async completeOrder(id: string): Promise<Order> {
    return this.updateStatus(id, OrderStatus.completed);
  }

  async expireOrder(id: string): Promise<Order> {
    return this.updateStatus(id, OrderStatus.expired);
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      activeOrders,
      totalUsers,
      ordersToday,
      grouped,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.pending } }),
      this.prisma.order.count({ where: { status: OrderStatus.active } }),
      this.prisma.user.count(),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.groupBy({
        by: ['fromRegion'],
        _count: { _all: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      activeOrders,
      totalUsers,
      ordersToday,
      ordersByRegion: grouped.map((item) => ({
        region: item.fromRegion,
        count: item._count._all,
      })),
    };
  }
}
