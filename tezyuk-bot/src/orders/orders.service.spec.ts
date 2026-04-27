import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

const mockPrisma = {
  order: {
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockNotificationProducer = {
  addNotificationJob: jest.fn(),
  addExpiryJob: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(
      mockPrisma as never,
      mockNotificationProducer as never,
    );
  });

  describe('createOrder', () => {
    const validInput = {
      userId: 'user-1',
      fromRegion: 'tashkent',
      fromDistrict: 'Yunusobod',
      toRegion: 'samarkand',
      toDistrict: '',
      cargoName: 'Mebel',
      weight: '2 tonna',
      truckType: 'Tentli',
      price: '500 000',
    };

    it('kunlik limit (5) dan oshsa BadRequestException tashlaydi', async () => {
      mockPrisma.order.count.mockResolvedValueOnce(5);
      await expect(service.createOrder(validInput)).rejects.toThrow(BadRequestException);
    });

    it('og\'irlikda raqam bo\'lmasa BadRequestException tashlaydi', async () => {
      mockPrisma.order.count.mockResolvedValueOnce(0);
      await expect(
        service.createOrder({ ...validInput, weight: 'tonna' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('muvaffaqiyatli buyurtma yaratadi va queue ga yuboradi', async () => {
      const fakeOrder = { id: 'order-1', ...validInput, status: OrderStatus.active };
      mockPrisma.order.count.mockResolvedValueOnce(0);
      mockPrisma.order.create.mockResolvedValueOnce(fakeOrder);
      mockNotificationProducer.addNotificationJob.mockResolvedValue(undefined);
      mockNotificationProducer.addExpiryJob.mockResolvedValue(undefined);

      const result = await service.createOrder(validInput);

      expect(result).toEqual(fakeOrder);
      expect(mockNotificationProducer.addNotificationJob).toHaveBeenCalledWith('order-1');
      expect(mockNotificationProducer.addExpiryJob).toHaveBeenCalledWith(
        'order-1',
        expect.any(Number),
      );
    });
  });

  describe('findById', () => {
    it('buyurtma topilmasa NotFoundException tashlaydi', async () => {
      mockPrisma.order.findUnique.mockResolvedValueOnce(null);
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('buyurtmani qaytaradi', async () => {
      const fakeOrder = { id: 'order-1', status: OrderStatus.active };
      mockPrisma.order.findUnique.mockResolvedValueOnce(fakeOrder);
      const result = await service.findById('order-1');
      expect(result).toEqual(fakeOrder);
    });
  });

  describe('cancelOrder', () => {
    it('statusni cancelled ga o\'zgartiradi', async () => {
      const fakeOrder = { id: 'order-1', status: OrderStatus.active };
      const cancelledOrder = { ...fakeOrder, status: OrderStatus.cancelled };
      mockPrisma.order.findUnique
        .mockResolvedValueOnce(fakeOrder)
        .mockResolvedValueOnce(fakeOrder);
      mockPrisma.order.update.mockResolvedValueOnce(cancelledOrder);

      const result = await service.cancelOrder('order-1');
      expect(result.status).toBe(OrderStatus.cancelled);
    });
  });

  describe('completeOrder', () => {
    it('statusni completed ga o\'zgartiradi', async () => {
      const fakeOrder = { id: 'order-1', status: OrderStatus.active };
      const completedOrder = { ...fakeOrder, status: OrderStatus.completed };
      mockPrisma.order.findUnique
        .mockResolvedValueOnce(fakeOrder)
        .mockResolvedValueOnce(fakeOrder);
      mockPrisma.order.update.mockResolvedValueOnce(completedOrder);

      const result = await service.completeOrder('order-1');
      expect(result.status).toBe(OrderStatus.completed);
    });
  });
});
