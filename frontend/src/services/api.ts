import axios from 'axios';
import type {
  Order,
  Inventory,
  Shipment,
  AfterSale,
  StockSummary,
  PageResult,
  OrderStatus,
  InventoryType,
  InventorySource,
  ShipmentStatus,
  AfterSaleStatus,
  AfterSaleType,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const orderApi = {
  getList: (params: { page?: number; pageSize?: number; status?: OrderStatus }) =>
    api.get<PageResult<Order>>('/orders', { params }),
  
  getDetail: (id: number) =>
    api.get<Order>(`/orders/${id}`),
  
  create: (data: Partial<Order>) =>
    api.post<Order>('/orders', data),
  
  update: (id: number, data: Partial<Order>) =>
    api.put<Order>(`/orders/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/orders/${id}`),
  
  updateStatus: (id: number, status: OrderStatus) =>
    api.put<Order>(`/orders/${id}/status`, { status }),
};

export const inventoryApi = {
  getList: (params: { page?: number; pageSize?: number; sku?: string; type?: InventoryType; source?: InventorySource }) =>
    api.get<PageResult<Inventory>>('/inventory', { params }),
  
  getDetail: (id: number) =>
    api.get<Inventory>(`/inventory/${id}`),
  
  create: (data: Partial<Inventory>) =>
    api.post<Inventory>('/inventory', data),
  
  getSummary: () =>
    api.get<StockSummary[]>('/inventory/summary'),
  
  getLowStock: (threshold: number = 10) =>
    api.get<StockSummary[]>(`/inventory/low-stock?threshold=${threshold}`),
  
  getStockBySku: (sku: string) =>
    api.get<number>(`/inventory/sku/${sku}`),
};

export const shipmentApi = {
  getList: (params: { page?: number; pageSize?: number; status?: ShipmentStatus }) =>
    api.get<PageResult<Shipment>>('/shipments', { params }),
  
  getDetail: (id: number) =>
    api.get<Shipment>(`/shipments/${id}`),
  
  create: (data: Partial<Shipment>) =>
    api.post<Shipment>('/shipments', data),
  
  update: (id: number, data: Partial<Shipment>) =>
    api.put<Shipment>(`/shipments/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/shipments/${id}`),
  
  ship: (id: number) =>
    api.post<Shipment>(`/shipments/${id}/ship`),
  
  deliver: (id: number) =>
    api.post<Shipment>(`/shipments/${id}/deliver`),
  
  cancel: (id: number) =>
    api.post<Shipment>(`/shipments/${id}/cancel`),
  
  shipWithInventory: (id: number, data: { sku: string; productName: string; quantity: number }) =>
    api.post<Shipment>(`/shipments/${id}/ship-with-inventory`, data),
};

export const afterSaleApi = {
  getList: (params: { page?: number; pageSize?: number; status?: AfterSaleStatus; type?: AfterSaleType }) =>
    api.get<PageResult<AfterSale>>('/aftersales', { params }),
  
  getDetail: (id: number) =>
    api.get<AfterSale>(`/aftersales/${id}`),
  
  create: (data: Partial<AfterSale>) =>
    api.post<AfterSale>('/aftersales', data),
  
  update: (id: number, data: Partial<AfterSale>) =>
    api.put<AfterSale>(`/aftersales/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/aftersales/${id}`),
  
  approve: (id: number) =>
    api.post<AfterSale>(`/aftersales/${id}/approve`),
  
  reject: (id: number, rejectReason: string) =>
    api.post<AfterSale>(`/aftersales/${id}/reject`, { rejectReason }),
  
  processReturn: (id: number) =>
    api.post<AfterSale>(`/aftersales/${id}/process-return`),
  
  processExchange: (id: number, newShipmentNo: string) =>
    api.post<AfterSale>(`/aftersales/${id}/process-exchange`, { newShipmentNo }),
  
  processRefund: (id: number) =>
    api.post<AfterSale>(`/aftersales/${id}/process-refund`),
  
  cancel: (id: number) =>
    api.post<AfterSale>(`/aftersales/${id}/cancel`),
};

export default api;
