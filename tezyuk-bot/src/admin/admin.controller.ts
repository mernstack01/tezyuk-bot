import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  @ApiOperation({ summary: "Buyurtmalar ro'yxati" })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getOrders(
    @Query('status') status?: OrderStatus,
    @Query('region') region?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getOrders({
      status,
      region,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Bitta buyurtma tafsiloti' })
  getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Patch('orders/:id')
  @ApiOperation({ summary: 'Buyurtma holatini yangilash' })
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.adminService.updateOrder(id, dto);
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: 'Buyurtmani bekor qilish' })
  deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(id);
  }

  @Get('users')
  @ApiOperation({ summary: "Foydalanuvchilar ro'yxati" })
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getUsers(page ?? 1, limit ?? 20);
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: "Foydalanuvchini bloklash yoki ochish" })
  toggleUserBlock(@Param('id') id: string) {
    return this.adminService.toggleUserBlock(id);
  }

  @Get('regions')
  @ApiOperation({ summary: "Hududlar ro'yxati" })
  getRegions() {
    return this.adminService.getRegions();
  }

  @Patch('regions/:id')
  @ApiOperation({ summary: 'Hududni yangilash' })
  updateRegion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegionDto,
  ) {
    return this.adminService.updateRegion(id, dto);
  }

  @Post('regions')
  @ApiOperation({ summary: "Yangi hudud qo'shish" })
  createRegion(@Body() dto: CreateRegionDto) {
    return this.adminService.createRegion(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistika' })
  getStats() {
    return this.adminService.getStats();
  }
}
