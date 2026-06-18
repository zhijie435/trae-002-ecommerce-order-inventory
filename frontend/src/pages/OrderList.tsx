import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { Order, OrderStatus } from '../types';
import { orderApi } from '../services/api';
import { orderStatusMap } from '../utils/enumMaps';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getList({ page, pageSize, status: statusFilter });
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Order) => {
    setEditingOrder(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleView = async (record: Order) => {
    try {
      const res = await orderApi.getDetail(record.id);
      setViewingOrder(res.data);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取订单详情失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await orderApi.delete(id);
      message.success('删除成功');
      fetchOrders();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: Partial<Order>) => {
    try {
      if (editingOrder) {
        await orderApi.update(editingOrder.id, values);
        message.success('更新成功');
      } else {
        await orderApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchOrders();
    } catch (error) {
      message.error(editingOrder ? '更新失败' : '创建失败');
    }
  };

  const handleStatusChange = async (id: number, status: OrderStatus) => {
    try {
      await orderApi.updateStatus(id, status);
      message.success('状态更新成功');
      fetchOrders();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '联系电话',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
    },
    {
      title: '收货地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (value: number) => `¥${value.toFixed(2)}`,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => {
        const info = orderStatusMap[status];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Order) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Select
            size="small"
            style={{ width: 100 }}
            value={record.status}
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            {Object.entries(orderStatusMap).map(([key, { label }]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>
          <Popconfirm title="确定删除此订单？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            {Object.entries(orderStatusMap).map(([key, { label }]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建订单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={editingOrder ? '编辑订单' : '新建订单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="orderNo"
            label="订单号"
            rules={[{ required: true, message: '请输入订单号' }]}
          >
            <Input placeholder="请输入订单号" />
          </Form.Item>
          <Form.Item
            name="customerName"
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item
            name="customerPhone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            name="address"
            label="收货地址"
            rules={[{ required: true, message: '请输入收货地址' }]}
          >
            <TextArea rows={3} placeholder="请输入收货地址" />
          </Form.Item>
          <Form.Item
            name="totalAmount"
            label="订单金额"
            rules={[{ required: true, message: '请输入订单金额' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="请输入订单金额" />
          </Form.Item>
          <Form.Item name="status" label="订单状态">
            <Select placeholder="请选择订单状态">
              {Object.entries(orderStatusMap).map(([key, { label }]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        destroyOnClose
      >
        {viewingOrder && (
          <div>
            <p><strong>订单号：</strong>{viewingOrder.orderNo}</p>
            <p><strong>客户姓名：</strong>{viewingOrder.customerName}</p>
            <p><strong>联系电话：</strong>{viewingOrder.customerPhone}</p>
            <p><strong>收货地址：</strong>{viewingOrder.address}</p>
            <p><strong>订单金额：</strong>¥{viewingOrder.totalAmount.toFixed(2)}</p>
            <p>
              <strong>订单状态：</strong>
              <Tag color={orderStatusMap[viewingOrder.status].color}>
                {orderStatusMap[viewingOrder.status].label}
              </Tag>
            </p>
            <p><strong>创建时间：</strong>{dayjs(viewingOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            {viewingOrder.remark && <p><strong>备注：</strong>{viewingOrder.remark}</p>}
            {viewingOrder.shipments && viewingOrder.shipments.length > 0 && (
              <div>
                <h4 style={{ marginTop: 16 }}>发货记录</h4>
                {viewingOrder.shipments.map((s) => (
                  <p key={s.id}>
                    {s.shipmentNo} - {s.trackingNo}
                  </p>
                ))}
              </div>
            )}
            {viewingOrder.afterSales && viewingOrder.afterSales.length > 0 && (
              <div>
                <h4 style={{ marginTop: 16 }}>售后记录</h4>
                {viewingOrder.afterSales.map((a) => (
                  <p key={a.id}>
                    {a.afterSaleNo} - {a.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default OrderList;
