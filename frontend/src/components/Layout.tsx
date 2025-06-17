// frontend/src/components/Layout.tsx
import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge, Button, Space } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Главная</Link>,
    },
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: <Link to="/contracts">Договоры</Link>,
    },
    {
      key: '/documents',
      icon: <FolderOutlined />,
      label: <Link to="/documents">Документы</Link>,
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: <Link to="/notifications">Уведомления</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Профиль</Link>,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: logout,
    },
  ];

  const selectedKey = location.pathname.split('/')[1] ? `/${location.pathname.split('/')[1]}` : '/dashboard';

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#001529',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          padding: '0 16px',
        }}>
          {collapsed ? 'КЖ' : 'Кызыл Жар'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space size="large">
            <Link to="/notifications">
              <Badge count={unreadCount} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{ fontSize: '16px' }}
                />
              </Badge>
            </Link>
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span>{user?.full_name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)',
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default AppLayout;