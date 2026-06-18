import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../order/order.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum LogisticsCompany {
  SF = 'shunfeng',
  YD = 'yunda',
  YT = 'yuantong',
  ZT = 'zhongtong',
  ST = 'shentong',
  JD = 'jd',
  EMS = 'ems',
  OTHER = 'other',
}

@Entity()
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  shipmentNo: string;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.shipments)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({
    type: 'simple-enum',
    enum: LogisticsCompany,
  })
  logisticsCompany: LogisticsCompany;

  @Column()
  trackingNo: string;

  @Column('int')
  itemsCount: number;

  @Column({
    type: 'simple-enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status: ShipmentStatus;

  @Column({ type: 'datetime', nullable: true })
  shippedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt: Date;

  @Column('text', { nullable: true })
  remark: string;

  @Column()
  operator: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
