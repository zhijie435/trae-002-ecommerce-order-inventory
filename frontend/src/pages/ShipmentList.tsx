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
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons';
import type { Shipment, ShipmentStatus, LogisticsCompany } from '../types';
import { shipmentApi, orderApi } from '../services/api';
import { shipmentStatusMap, logisticsCompanyMap } from '../utils/enumMaps';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ShipmentList: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [orders, setOrders] = useState<{ id: number; orderNo: string }[]>([]);
  const [shipForm] = Form.useForm();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchShipments();
    fetchOrders();
  }, [page, pageSize, statusFilter]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await shipmentApi.getList({ page, pageSize, status: statusFilter });
      setShipments(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载发货列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getList({ page: 1, pageSize: 100 });
      setOrders(res.data.data.map(o => ({ id: o.id, orderNo: o.orderNo }));
    } catch (error) {
      // ignore
    }
  };

  const handleAdd = () => {
    setEditingShipment(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Shipment) => {
    setEditingShipment(record);
    form.setFieldsValue({
      ...record,
      orderId: record.orderId,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await shipmentApi.delete(id);
      message.success('删除成功');
      fetchShipments();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: Partial<Shipment>) => {
    try {
      if (editingShipment) {
        await shipmentApi.update(editingShipment.id, values);
        message.success('更新成功');
      } else {
        await shipmentApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchShipments();
    } catch (error) {
      message.error(editingShipment ? '更新失败' : '创建失败');
    }
  };

  const handleShip = (id: number) => {
    setShippingId(id);
    setShipModalVisible(true);
  };

  const handleShipSubmit = async (values: { sku: string; productName: string; quantity: number }) => {
    if (!shippingId) return;
    try {
      await shipmentApi.shipWithInventory(shippingId, values);
      message.success('发货成功，库存已扣减');
      setShipModalVisible(false);
      setShippingId(null);
      fetchShipments();
    } catch (error) {
      message.error('发货失败');
    }
  };

  const handleDeliver = async (id: number) => {
    try {
      await shipmentApi.deliver(id);
      message.success('签收成功');
      fetchShipments();
    } catch (error) {
      message.error('签收失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await shipmentApi.cancel(id);
      message.success('取消成功');
      fetchShipments();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const columns = [
    {
      title: '发货单号',
      dataIndex: 'shipmentNo',
      key: 'shipmentNo',
    },
    {
      title: '关联订单',
      key: 'order',
      render: (_: unknown, record: Shipment) => record.order?.orderNo || '-',
    },
    {
      title: '物流公司',
      dataIndex: 'logisticsCompany',
      key: 'logisticsCompany',
      render: (company: LogisticsCompany) => logisticsCompanyMap[company]?.label || company,
    },
    {
      title: '快递单号',
      dataIndex: 'trackingNo',
      key: 'trackingNo',
    },
    {
      title: '商品数量',
      dataIndex: 'itemsCount',
      key: 'itemsCount',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ShipmentStatus) => {
        const info = shipmentStatusMap[status];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '发货时间',
      dataIndex: 'shippedAt',
      key: 'shippedAt',
      render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '签收时间',
      dataIndex: 'deliveredAt',
      key: 'deliveredAt',
      render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Shipment) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleShip(record.id)}
            >
              发货
            </Button>
          )}
          {record.status === 'shipped' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleDeliver(record.id)}
            >
              签收
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'shipped') && (
              <Popconfirm title="确定取消此发货单？" onConfirm={() => handleCancel(record.id)}>
                <Button type="link" size="small" danger icon={<StopOutlined />}>
                  取消
                </Button>
              </Popconfirm>
            )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此发货单？" onConfirm={() => handleDelete(record.id)}>
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
          {Object.entries(shipmentStatusMap).map(([key, { label }]) => (
            <Option key={key} value={key}>
              {label}
            </Option>
          ))}
        </Select>
      </Space>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
        新建发货单
      </Button>
    </div>

    <Table
      columns={columns}
      dataSource={shipments}
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
      title={editingShipment ? '编辑发货单' : '新建发货单'}
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="shipmentNo"
          label="发货单号"
          rules={[{ required: true, message: '请输入发货单号' }]}
        >
          <Input placeholder="请输入发货单号" />
        </Form.Item>
        <Form.Item
          name="orderId"
          label="关联订单"
          rules={[{ required: true, message: '请选择关联订单' }]}
        >
          <Select placeholder="请选择关联订单">
            {orders.map(order => (
              <Option key={order.id} value={order.id}>
                {order.orderNo}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="logisticsCompany"
          label="物流公司"
          rules={[{ required: true, message: '请选择物流公司' }]}
        >
          <Select placeholder="请选择物流公司">
            {Object.entries(logisticsCompanyMap).map(([key, { label }]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="trackingNo"
          label="快递单号"
          rules={[{ required: true, message: '请输入快递单号' }]}
        >
          <Input placeholder="请输入快递单号" />
        </Form.Item>
        <Form.Item
          name="itemsCount"
          label="商品数量"
          rules={[{ required: true, message: '请输入商品数量' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入商品数量" />
        </Form.Item>
        <Form.Item
          name="operator"
          label="操作人"
          rules={[{ required: true, message: '请输入操作人' }]}
        >
          <Input placeholder="请输入操作人" />
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
      title="发货（扣减库存"
      open={shipModalVisible}
      onCancel={() => {
        setShipModalVisible(false);
        setShippingId(null);
      }}
      footer={null}
      destroyOnClose
    >
      <Form form={shipForm} layout="vertical" onFinish={handleShipSubmit}>
        <Form.Item
          name="sku"
          label="SKU"
          rules={[{ required: true, message: '请输入SKU' }]}
        >
          <Input placeholder="请输入SKU" />
        </Form.Item>
        <Form.Item
          name="productName"
          label="商品名称"
          rules={[{ required: true, message: '请输入商品名称' }]}
        >
          <Input placeholder="请输入商品名称" />
        </Form.Item>
        <Form.Item
          name="quantity"
          label="数量"
          rules={[{ required: true, message: '请输入数量' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入数量" />
        </Form.Item>
        <Form.Item>
          <Space style={{ float: 'right' }}>
            <Button onClick={() => {
              setShipModalVisible(false);
              setShippingId(null);
            }}>取消</Button>
            <Button type="primary" htmlType="submit">
              确定发货
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  </Card>
  );
};

export default ShipmentList;
