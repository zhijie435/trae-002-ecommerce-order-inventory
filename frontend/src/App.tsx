import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import AppLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OrderList from './pages/OrderList';
import InventoryList from './pages/InventoryList';
import ShipmentList from './pages/ShipmentList';
import AfterSaleList from './pages/AfterSaleList';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <AppLayout>
      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/shipments" element={<ShipmentList />} />
          <Route path="/aftersales" element={<AfterSaleList />} />
        </Routes>
      </Content>
    </AppLayout>
  );
};

export default App;
