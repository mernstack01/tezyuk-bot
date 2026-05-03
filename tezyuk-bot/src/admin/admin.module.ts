import { Module } from '@nestjs/common';
import { OrdersModule } from 'src/orders/orders.module';
import { RegionsModule } from 'src/regions/regions.module';
import { SettingsModule } from 'src/settings/settings.module';
import { UsersModule } from 'src/users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [OrdersModule, UsersModule, RegionsModule, SettingsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
