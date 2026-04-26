import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification.processor';
import { NotificationProducer } from './notification.producer';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  providers: [NotificationProducer, NotificationProcessor],
  exports: [NotificationProducer],
})
export class NotificationsModule {}
