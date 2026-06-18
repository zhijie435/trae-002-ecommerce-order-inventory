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
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import { PlusOutlined, StockOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { Inventory, InventoryType, InventorySource, StockSummary } from '../types';
import { inventoryApi } from '../services/api';
import { inventoryTypeMap, inventorySourceMap } from '../utils/enumMaps';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const InventoryList: React.FC = () => {
  const [records, setRecords] = useState<Inventory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<InventoryType | undefined>();
  const [sourceFilter, setSourceFilter] = useState<InventorySource | undefined>();
  const [skuFilter, setSkuFilter] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [stockSummary, setStockSummary] = useState<StockSummary[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRecords();
    fetchStockSummary();
  }, [page, pageSize, typeFilter, sourceFilter, skuFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getList({
        page,
        pageSize,
        type: typeFilter,
        source: sourceFilter,
        sku: skuFilter || undefined,
      });
      setRecords(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载库存流水失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSummary = async () => {
    try {
      const res = await inventoryApi.getSummary();
      setStockSummary(res.data);
    } catch (error) {
      // ignore
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values: Partial<Inventory>) => {
    try {
      await inventoryApi.create(values);
      message.success('创建成功');
      setModalVisible(false);
      fetchRecords();
      fetchStockSummary();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '变动数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number, record: Inventory) => (
        <span style={{ color: record.type === 'in' ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {record.type === 'in' ? '+' : record.type === 'out' ? '-' : ''}{value}
        </span>
      ),
    },
    {
      title: '变动前库存',
      dataIndex: 'stockBefore',
      key: 'stockBefore',
    },
    {
      title: '变动后库存',
      dataIndex: 'stockAfter',
      key: 'stockAfter',
      render: (value: number) => <strong>{value}</strong>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: InventoryType) => {
        const info = inventoryTypeMap[type];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: InventorySource) => {
        const info = inventorySourceMap[source];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '关联单号',
      key: 'related',
      render: (_: unknown, record: Inventory) => (
        <div>
          {record.relatedOrderNo && <div>订单: {record.relatedOrderNo}</div>}
          {record.relatedShipmentNo && <div>发货: {record.relatedShipmentNo}</div>}
          {record.relatedAfterSaleNo && <div>售后: {record.relatedAfterSaleNo}</div>}
        </div>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const totalStock = stockSummary.reduce((sum, item) => sum + item.stock, 0);
  const totalValue = stockSummary.reduce((sum, item) => sum + item.stock, 0);

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前总库存"
              value={totalStock}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="SKU种类"
              value={stockSummary.length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="流水记录数"
              value={total}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="库存汇总">
        <Table
          dataSource={stockSummary}
          rowKey="sku"
          pagination={false}
          size="small"
          columns={[
            { title: 'SKU', dataIndex: 'sku', key: 'sku' },
            { title: '商品名称', dataIndex: 'productName', key: 'productName' },
            {
              title: '当前库存',
              dataIndex: 'stock',
              key: 'stock',
              render: (value: number) => (
                <span style={{ color: value <= 10 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
                  {value}
                </span>
              ),
            },
          ]}
        />
      </Card>

      <Card title="库存流水" style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Input
              placeholder="搜索SKU"
              allowClear
              style={{ width: 150 }}
              value={skuFilter}
              onChange={(e) => {
                setSkuFilter(e.target.value);
                setPage(1);
              }}
            />
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
              {Object.entries(inventoryTypeMap).map(([key, { label }]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="筛选来源"
              allowClear
              style={{ width: 140 }}
              value={sourceFilter}
              onChange={(value) => {
                setSourceFilter(value);
                setPage(1);
              }}
            >
              {Object.entries(inventorySourceMap).map(([key, { label }]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增库存记录
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={records}
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
      </Card>

      <Modal
        title="新增库存记录"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              {Object.entries(inventoryTypeMap).map(([key, { label }]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="source"
            label="来源"
            rules={[{ required: true, message: '请选择来源' }]}
          >
            <Select placeholder="请选择来源">
              {Object.entries(inventorySourceMap).map(([key, { label }]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="relatedOrderNo" label="关联订单号">
            <Input placeholder="请输入关联订单号" />
          </Form.Item>
          <Form.Item name="relatedShipmentNo" label="关联发货单号">
            <Input placeholder="请输入关联发货单号" />
          </Form.Item>
          <Form.Item name="relatedAfterSaleNo" label="关联售后单号">
            <Input placeholder="请输入关联售后单号" />
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
    </div>
  );
};

export default InventoryList;
