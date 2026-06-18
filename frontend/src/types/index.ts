export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

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

export interface Order {
  id: number;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  address: string;
  totalAmount: number;
  status: OrderStatus;
  remark?: string;
  shipments?: Shipment[];
  afterSales?: AfterSale[];
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: number;
  sku: string;
  productName: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  type: InventoryType;
  source: InventorySource;
  relatedOrderNo?: string;
  relatedShipmentNo?: string;
  relatedAfterSaleNo?: string;
  remark?: string;
  operator: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: number;
  shipmentNo: string;
  orderId: number;
  order?: Order;
  logisticsCompany: LogisticsCompany;
  trackingNo: string;
  itemsCount: number;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  remark?: string;
  operator: string;
  createdAt: string;
  updatedAt: string;
}

export interface AfterSale {
  id: number;
  afterSaleNo: string;
  orderId: number;
  order?: Order;
  type: AfterSaleType;
  status: AfterSaleStatus;
  refundAmount?: number;
  returnTrackingNo?: string;
  exchangeShipmentNo?: string;
  reason: string;
  rejectReason?: string;
  sku?: string;
  productName?: string;
  quantity?: number;
  approvedAt?: string;
  completedAt?: string;
  remark?: string;
  operator: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockSummary {
  sku: string;
  productName: string;
  stock: number;
}

export interface PageResult<T> {
  data: T[];
  total: number;
}
