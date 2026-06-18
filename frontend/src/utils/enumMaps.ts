import {
  OrderStatus,
  InventoryType,
  InventorySource,
  ShipmentStatus,
  LogisticsCompany,
  AfterSaleType,
  AfterSaleStatus,
} from '../types';

export const orderStatusMap: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]: { label: '待付款', color: 'orange' },
  [OrderStatus.PAID]: { label: '已付款', color: 'blue' },
  [OrderStatus.SHIPPED]: { label: '已发货', color: 'cyan' },
  [OrderStatus.COMPLETED]: { label: '已完成', color: 'green' },
  [OrderStatus.CANCELLED]: { label: '已取消', color: 'red' },
};

export const inventoryTypeMap: Record<InventoryType, { label: string; color: string }> = {
  [InventoryType.IN]: { label: '入库', color: 'green' },
  [InventoryType.OUT]: { label: '出库', color: 'red' },
  [InventoryType.ADJUST]: { label: '调整', color: 'orange' },
};

export const inventorySourceMap: Record<InventorySource, { label: string; color: string }> = {
  [InventorySource.PURCHASE]: { label: '采购入库', color: 'blue' },
  [InventorySource.SHIPMENT]: { label: '订单发货', color: 'cyan' },
  [InventorySource.AFTERSALE_RETURN]: { label: '售后退货', color: 'purple' },
  [InventorySource.AFTERSALE_EXCHANGE]: { label: '售后换货', color: 'magenta' },
  [InventorySource.MANUAL_ADJUST]: { label: '手动调整', color: 'orange' },
};

export const shipmentStatusMap: Record<ShipmentStatus, { label: string; color: string }> = {
  [ShipmentStatus.PENDING]: { label: '待发货', color: 'orange' },
  [ShipmentStatus.SHIPPED]: { label: '已发货', color: 'blue' },
  [ShipmentStatus.DELIVERED]: { label: '已签收', color: 'green' },
  [ShipmentStatus.CANCELLED]: { label: '已取消', color: 'red' },
};

export const logisticsCompanyMap: Record<LogisticsCompany, { label: string }> = {
  [LogisticsCompany.SF]: { label: '顺丰速运' },
  [LogisticsCompany.YD]: { label: '韵达快递' },
  [LogisticsCompany.YT]: { label: '圆通速递' },
  [LogisticsCompany.ZT]: { label: '中通快递' },
  [LogisticsCompany.ST]: { label: '申通快递' },
  [LogisticsCompany.JD]: { label: '京东物流' },
  [LogisticsCompany.EMS]: { label: 'EMS' },
  [LogisticsCompany.OTHER]: { label: '其他' },
};

export const afterSaleTypeMap: Record<AfterSaleType, { label: string; color: string }> = {
  [AfterSaleType.RETURN]: { label: '退货', color: 'orange' },
  [AfterSaleType.EXCHANGE]: { label: '换货', color: 'blue' },
  [AfterSaleType.REFUND]: { label: '退款', color: 'red' },
};

export const afterSaleStatusMap: Record<AfterSaleStatus, { label: string; color: string }> = {
  [AfterSaleStatus.PENDING]: { label: '待审核', color: 'orange' },
  [AfterSaleStatus.APPROVED]: { label: '已通过', color: 'blue' },
  [AfterSaleStatus.REJECTED]: { label: '已拒绝', color: 'red' },
  [AfterSaleStatus.PROCESSING]: { label: '处理中', color: 'cyan' },
  [AfterSaleStatus.COMPLETED]: { label: '已完成', color: 'green' },
  [AfterSaleStatus.CANCELLED]: { label: '已取消', color: 'default' },
};
