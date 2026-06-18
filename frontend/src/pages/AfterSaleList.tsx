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
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { AfterSale, AfterSaleStatus, AfterSaleType } from '../types';
import { afterSaleApi, orderApi } from '../services/api';
import { afterSaleStatusMap, afterSaleTypeMap } from '../utils/enumMaps';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const AfterSaleList: React.FC = () => {
  const [afterSales, setAfterSales] = useState<AfterSale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<AfterSaleStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<AfterSaleType | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [editingAfterSale, setEditingAfterSale] = useState<AfterSale | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [orders, setOrders] = useState<{ id: number; orderNo: string }[]>([]);
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [exchangeForm] = Form.useForm();

  useEffect(() => {
    fetchAfterSales();
    fetchOrders();
  }, [page, pageSize, statusFilter, typeFilter]);

  const fetchAfterSales = async () => {
    setLoading(true);
    try {
      const res = await afterSaleApi.getList({ page, pageSize, status: statusFilter, type: typeFilter });
      setAfterSales(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载售后列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getList({ page: 1, pageSize: 100 });
      setOrders(res.data.data.map(o => ({ id: o.id, orderNo: o.orderNo })));
    } catch (error) {
      // ignore
    }
  };

  const handleAdd = () => {
    setEditingAfterSale(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AfterSale) => {
    setEditingAfterSale(record);
    form.setFieldsValue({
      ...record,
      orderId: record.orderId,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await afterSaleApi.delete(id);
      message.success('删除成功');
      fetchAfterSales();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: Partial<AfterSale>) => {
    try {
      if (editingAfterSale) {
        await afterSaleApi.update(editingAfterSale.id, values);
        message.success('更新成功');
      } else {
        await afterSaleApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchAfterSales();
    } catch (error) {
      message.error(editingAfterSale ? '更新失败' : '创建失败');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await afterSaleApi.approve(id);
      message.success('审批通过');
      fetchAfterSales();
    } catch (error) {
      message.error('审批失败');
    }
  };

  const handleReject = (id: number) => {
    setProcessingId(id);
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async (values: { rejectReason: string }) => {
    if (!processingId) return;
    try {
      await afterSaleApi.reject(processingId, values.rejectReason);
      message.success('已拒绝');
      setRejectModalVisible(false);
      setProcessingId(null);
      fetchAfterSales();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleProcessReturn = async (id: number) => {
    try {
      await afterSaleApi.processReturn(id);
      message.success('退货入库完成，库存已增加');
      fetchAfterSales();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const handleProcessExchange = (id: number) => {
    setProcessingId(id);
    setExchangeModalVisible(true);
  };

  const handleProcessExchangeSubmit = async (values: { newShipmentNo: string }) => {
    if (!processingId) return;
    try {
      await afterSaleApi.processExchange(processingId, values.newShipmentNo);
      message.success('换货处理完成，库存已更新');
      setExchangeModalVisible(false);
      setProcessingId(null);
      fetchAfterSales();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const handleProcessRefund = async (id: number) => {
    try {
      await afterSaleApi.processRefund(id);
      message.success('退款处理完成');
      fetchAfterSales();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await afterSaleApi.cancel(id);
      message.success('取消成功');
      fetchAfterSales();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const columns = [
    {
      title: '售后单号',
      dataIndex: 'afterSaleNo',
      key: 'afterSaleNo',
    },
    {
      title: '关联订单',
      key: 'order',
      render: (_: unknown, record: AfterSale) => record.order?.orderNo || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: AfterSaleType) => {
        const info = afterSaleTypeMap[type];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AfterSaleStatus) => {
        const info = afterSaleStatusMap[status];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      render: (value: number) => value ? `¥${value.toFixed(2)}` : '-',
    },
    {
      title: '商品信息',
      key: 'product',
      render: (_: unknown, record: AfterSale) => (
        <div>
          {record.sku && <div>SKU: {record.sku}</div>}
          {record.productName && <div>名称: {record.productName}</div>}
          {record.quantity && <div>数量: {record.quantity}</div>}
        </div>
      ),
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
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
      render: (_: unknown, record: AfterSale) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            {record.status === 'pending' && (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record.id)}
                >
                  通过
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record.id)}
                >
                  拒绝
                </Button>
              </>
            )}
            {record.status === 'approved' && record.type === 'return' && (
              <Button
                type="link"
                size="small"
                onClick={() => handleProcessReturn(record.id)}
              >
                退货入库
              </Button>
            )}
            {record.status === 'approved' && record.type === 'exchange' && (
              <Button
                type="link"
                size="small"
                onClick={() => handleProcessExchange(record.id)}
              >
                换货处理
              </Button>
            )}
            {record.status === 'approved' && record.type === 'refund' && (
              <Button
                type="link"
                size="small"
                onClick={() => handleProcessRefund(record.id)}
              >
                退款处理
              </Button>
            )}
            {(record.status === 'pending' || record.status === 'approved') && (
              <Popconfirm title="确定取消此售后单？" onConfirm={() => handleCancel(record.id)}>
                <Button type="link" size="small" danger>
                  取消
                </Button>
              </Popconfirm>
            )}
          </Space>
          <Space size="small">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Popconfirm title="确定删除此售后单？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Select
            placeholder="筛选类型"
            allowClear
            style={{ width: 120 }}
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
          >
            {Object.entries(afterSaleTypeMap).map(([key, { label }]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>
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
            {Object.entries(afterSaleStatusMap).map(([key, { label }]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建售后单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={afterSales}
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
        title={editingAfterSale ? '编辑售后单' : '新建售后单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="afterSaleNo"
            label="售后单号"
            rules={[{ required: true, message: '请输入售后单号' }]}
          >
            <Input placeholder="请输入售后单号" />
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
            name="type"
            label="售后类型"
            rules={[{ required: true, message: '请选择售后类型' }]}
          >
            <Select placeholder="请选择售后类型">
              {Object.entries(afterSaleTypeMap).map(([key, { label }]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="refundAmount" label="退款金额">
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="请输入退款金额" />
          </Form.Item>
          <Form.Item name="sku" label="SKU">
            <Input placeholder="请输入SKU" />
          </Form.Item>
          <Form.Item name="productName" label="商品名称">
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item name="quantity" label="数量">
            <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入数量" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="申请原因"
            rules={[{ required: true, message: '请输入申请原因' }]}
          >
            <TextArea rows={3} placeholder="请输入申请原因" />
          </Form.Item>
          <Form.Item name="returnTrackingNo" label="退货快递单号">
            <Input placeholder="请输入退货快递单号" />
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
        title="拒绝售后申请"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setProcessingId(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleRejectSubmit}>
          <Form.Item
            name="rejectReason"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <TextArea rows={4} placeholder="请输入拒绝原因" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setRejectModalVisible(false);
                setProcessingId(null);
              }}>取消</Button>
              <Button type="primary" danger htmlType="submit">
                确认拒绝
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="换货处理"
        open={exchangeModalVisible}
        onCancel={() => {
          setExchangeModalVisible(false);
          setProcessingId(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={exchangeForm} layout="vertical" onFinish={handleProcessExchangeSubmit}>
          <Form.Item
            name="newShipmentNo"
            label="新发货单号"
            rules={[{ required: true, message: '请输入新发货单号' }]}
          >
            <Input placeholder="请输入新发货单号" />
          </Form.Item>
          <p style={{ color: '#666', marginBottom: 16 }}>
            系统将自动完成：退货入库 + 新货出库 的库存变更
          </p>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setExchangeModalVisible(false);
                setProcessingId(null);
              }}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认处理
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AfterSaleList;
