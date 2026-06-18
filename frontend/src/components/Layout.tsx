import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  StockOutlined,
  TruckOutlined,
  RollbackOutlined,
} from '@ant-design/icons';

const { Header, Sider } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据概览',
    },
    {
      key: '/orders',
      icon: <ShoppingOutlined />,
      label: '订单管理',
    },
    {
      key: '/inventory',
      icon: <StockOutlined />,
      label: '库存流水',
    },
    {
      key: '/shipments',
      icon: <TruckOutlined />,
      label: '发货管理',
    },
    {
      key: '/aftersales',
      icon: <RollbackOutlined />,
      label: '售后管理',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 12 : 18, fontWeight: 'bold' }}>
          {collapsed ? 'ERP' : '电商后台管理'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '电商后台管理'}
          </h2>
          <div style={{ color: '#666' }}>管理员</div>
        </Header>
        {children}
      </Layout>
    </Layout>
  );
};

export default AppLayout;
