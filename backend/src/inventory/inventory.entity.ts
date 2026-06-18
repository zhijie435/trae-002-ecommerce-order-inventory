import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum InventoryType {
  IN = 'in',
  OUT = 'out',
  ADJUST = 'adjust',
}

export enum InventorySource {
  PURCHASE = 'purchase',
  SHIPMENT = 'shipment',
  AFTERSALE_RETURN = 'aftersale_return',
  AFTERSALE_EXCHANGE = 'aftersale_exchange',
  MANUAL_ADJUST = 'manual_adjust',
}

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sku: string;

  @Column()
  productName: string;

  @Column('int')
  quantity: number;

  @Column('int')
  stockBefore: number;

  @Column('int')
  stockAfter: number;

  @Column({
    type: 'simple-enum',
    enum: InventoryType,
  })
  type: InventoryType;

  @Column({
    type: 'simple-enum',
    enum: InventorySource,
  })
  source: InventorySource;

  @Column({ nullable: true })
  relatedOrderNo: string;

  @Column({ nullable: true })
  relatedShipmentNo: string;

  @Column({ nullable: true })
  relatedAfterSaleNo: string;

  @Column('text', { nullable: true })
  remark: string;

  @Column()
  operator: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
