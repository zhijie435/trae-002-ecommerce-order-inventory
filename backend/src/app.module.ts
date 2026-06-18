import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from './order/order.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShipmentModule } from './shipment/shipment.module';
import { AfterSaleModule } from './aftersale/aftersale.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
    OrderModule,
    InventoryModule,
    ShipmentModule,
    AfterSaleModule,
  ],
})
export class AppModule {}
