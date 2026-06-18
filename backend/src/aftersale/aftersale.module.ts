import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfterSale } from './aftersale.entity';
import { AfterSaleService } from './aftersale.service';
import { AfterSaleController } from './aftersale.controller';
import { OrderModule } from '../order/order.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AfterSale]),
    OrderModule,
    InventoryModule,
  ],
  controllers: [AfterSaleController],
  providers: [AfterSaleService],
  exports: [AfterSaleService],
})
export class AfterSaleModule {}
