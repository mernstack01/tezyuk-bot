import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SettingsModule } from 'src/settings/settings.module';
import { OrdersService } from './orders.service';

@Module({
  imports: [NotificationsModule, SettingsModule],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
