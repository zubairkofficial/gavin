import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PaymentSeassionService } from './payment-seassion.service';
import { PaymentController } from './payment-seassion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/payment.entity';
import { RawBodyMiddleware } from '../common/middleware/raw-body.middleware';
import { User } from '@/auth/entities/user.entity';

@Module({
  imports: [
   TypeOrmModule.forFeature([Subscription , User]),
  ],
  controllers: [PaymentController],
  providers: [PaymentSeassionService],
})
export class PaymentSeassionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes('/payment-session/webhook');
  }
}
