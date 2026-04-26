import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from 'src/orders/orders.service';
import { RegionsService } from 'src/regions/regions.service';
import { UsersService } from 'src/users/users.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly regionsService: RegionsService,
  ) {}

  getOrders(params: {
    status?: OrderStatus;
    region?: string;
    page: number;
    limit: number;
  }) {
    return this.ordersService.listForAdmin(params);
  }

  getOrderById(id: string) {
    return this.ordersService.findById(id);
  }

  updateOrder(id: string, dto: UpdateOrderDto) {
    return this.ordersService.updateOrder(id, dto);
  }

  deleteOrder(id: string) {
    return this.ordersService.cancelOrder(id);
  }

  getUsers(page: number, limit: number) {
    return this.usersService.list(page, limit);
  }

  toggleUserBlock(id: string) {
    return this.usersService.toggleBlock(id);
  }

  getRegions() {
    return this.regionsService.listAll();
  }

  createRegion(dto: CreateRegionDto) {
    return this.regionsService.createRegion(dto);
  }

  updateRegion(id: number, dto: UpdateRegionDto) {
    return this.regionsService.updateRegion(id, dto);
  }

  getStats() {
    return this.ordersService.getStats();
  }
}
