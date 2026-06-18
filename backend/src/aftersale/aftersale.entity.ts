import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../order/order.entity';

export enum AfterSaleType {
  RETURN = 'return',
  EXCHANGE = 'exchange',
  REFUND = 'refund',
}

export enum AfterSaleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class AfterSale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  afterSaleNo: string;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.afterSales)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({
    type: 'simple-enum',
    enum: AfterSaleType,
  })
  type: AfterSaleType;

  @Column({
    type: 'simple-enum',
    enum: AfterSaleStatus,
    default: AfterSaleStatus.PENDING,
  })
  status: AfterSaleStatus;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ nullable: true })
  returnTrackingNo: string;

  @Column({ nullable: true })
  exchangeShipmentNo: string;

  @Column('text')
  reason: string;

  @Column('text', { nullable: true })
  rejectReason: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  productName: string;

  @Column('int', { nullable: true })
  quantity: number;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  remark: string;

  @Column()
  operator: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
