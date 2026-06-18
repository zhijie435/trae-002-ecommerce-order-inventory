import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, message } from 'antd';
import {
  ShoppingOutlined,
  StockOutlined,
  TruckOutlined,
  RollbackOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { StockSummary, Order, Shipment, AfterSale } from '../types';
import { inventoryApi, orderApi, shipmentApi, afterSaleApi } from '../services/api';
import { orderStatusMap, shipmentStatusMap, afterSaleStatusMap } from '../utils/enumMaps';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const [lowStock, setLowStock] = useState<StockSummary[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
  const [pendingAfterSales, setPendingAfterSales] = useState<AfterSale[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalStock: 0,
    pendingShipments: 0,
    pendingAfterSales: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lowStockRes, ordersRes, shipmentsRes, afterSalesRes, stockSummary] = await Promise.all([
        inventoryApi.getLowStock(10),
        orderApi.getList({ page: 1, pageSize: 5 }),
        shipmentApi.getList({ page: 1, pageSize: 5 }),
        afterSaleApi.getList({ page: 1, pageSize: 5 }),
        inventoryApi.getSummary(),
      ]);

      setLowStock(lowStockRes.data);
      setRecentOrders(ordersRes.data.data);
      setPendingShipments(shipmentsRes.data.data);
      setPendingAfterSales(afterSalesRes.data.data);
      setStats({
        totalOrders: ordersRes.data.total,
        totalStock: stockSummary.data.reduce((sum, item) => sum + item.stock, 0),
        pendingShipments: shipmentsRes.data.data.filter(s => s.status === 'pending').length,
        pendingAfterSales: afterSalesRes.data.data.filter(a => a.status === 'pending').length,
      });
    } catch (error) {
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const lowStockColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <span style={{ color: stock <= 5 ? '#ff4d4f' : '#faad14', fontWeight: 'bold' }}>
          <WarningOutlined style={{ marginRight: 4 }} />
          {stock}
        </span>
      ),
    },
  ];

  const orderColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = orderStatusMap[status as keyof typeof orderStatusMap];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  const shipmentColumns = [
    { title: '发货单号', dataIndex: 'shipmentNo', key: 'shipmentNo' },
    { title: '关联订单', dataIndex: ['order', 'orderNo'], key: 'orderNo' },
    { title: '快递单号', dataIndex: 'trackingNo', key: 'trackingNo' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = shipmentStatusMap[status as keyof typeof shipmentStatusMap];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
  ];

  const afterSaleColumns = [
    { title: '售后单号', dataIndex: 'afterSaleNo', key: 'afterSaleNo' },
    { title: '关联订单', dataIndex: ['order', 'orderNo'], key: 'orderNo' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const info = afterSaleStatusMap[type as keyof typeof afterSaleStatusMap];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = afterSaleStatusMap[status as keyof typeof afterSaleStatusMap];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.totalOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="库存总数"
              value={stats.totalStock}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待发货"
              value={stats.pendingShipments}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核售后"
              value={stats.pendingAfterSales}
              prefix={<RollbackOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="库存预警" loading={loading}>
            <Table
              columns={lowStockColumns}
              dataSource={lowStock}
              rowKey="sku"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近订单" loading={loading}>
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="最近发货单" loading={loading}>
            <Table
              columns={shipmentColumns}
              dataSource={pendingShipments}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近售后单" loading={loading}>
            <Table
              columns={afterSaleColumns}
              dataSource={pendingAfterSales}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
