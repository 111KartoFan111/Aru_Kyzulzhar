// frontend/src/pages/Notifications.tsx
import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Empty,
  Select,
  Row,
  Col,
  Popconfirm,
  Badge,
  Avatar,
} from 'antd';
import {
  BellOutlined,
  CalendarOutlined,
  DollarOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  CheckOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification } from '../services/api';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const Notifications: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 20 };
    
    switch (type) {
      case 'contract_expiry':
        return <CalendarOutlined {...iconProps} style={{ color: '#ff4d4f' }} />;
      case 'payment_due':
        return <DollarOutlined {...iconProps} style={{ color: '#faad14' }} />;
      case 'document_expiry':
        return <FolderOutlined {...iconProps} style={{ color: '#1890ff' }} />;
      case 'document_upload':
        return <FolderOutlined {...iconProps} style={{ color: '#52c41a' }} />;
      default:
        return <InfoCircleOutlined {...iconProps} style={{ color: '#722ed1' }} />;
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'contract_expiry':
        return 'Истечение договора';
      case 'payment_due':
        return 'Оплата аренды';
      case 'document_expiry':
        return 'Истечение документа';
      case 'document_upload':
        return 'Загрузка документа';
      default:
        return 'Информация';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'contract_expiry':
        return 'red';
      case 'payment_due':
        return 'orange';
      case 'document_expiry':
        return 'blue';
      case 'document_upload':
        return 'green';
      default:
        return 'purple';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'read':
        return notification.is_read;
      case 'contract_expiry':
      case 'payment_due':
      case 'document_expiry':
      case 'document_upload':
        return notification.type === filter;
      default:
        return true;
    }
  });

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>
              Уведомления 
              {unreadCount > 0 && (
                <Badge count={unreadCount} style={{ marginLeft: '8px' }} />
              )}
            </Title>
          </Col>
          <Col>
            <Space>
              {unreadCount > 0 && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={markAllAsRead}
                >
                  Отметить все как прочитанные
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Фильтр уведомлений"
              value={filter}
              onChange={setFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Все уведомления</Option>
              <Option value="unread">Непрочитанные</Option>
              <Option value="read">Прочитанные</Option>
              <Option value="contract_expiry">Истечение договоров</Option>
              <Option value="payment_due">Оплата аренды</Option>
              <Option value="document_expiry">Истечение документов</Option>
              <Option value="document_upload">Загрузка документов</Option>
            </Select>
          </Col>
        </Row>

        {filteredNotifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Нет уведомлений"
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={filteredNotifications}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} из ${total} уведомлений`,
            }}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                style={{
                  backgroundColor: notification.is_read ? '#fff' : '#f6ffed',
                  border: notification.is_read ? '1px solid #f0f0f0' : '1px solid #b7eb8f',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  padding: '16px',
                }}
                actions={[
                  !notification.is_read && (
                    <Button
                      type="text"
                      icon={<CheckOutlined />}
                      onClick={() => handleMarkAsRead(notification)}
                      title="Отметить как прочитанное"
                    />
                  ),
                  <Popconfirm
                    title="Удалить уведомление?"
                    onConfirm={() => handleDelete(notification.id)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      title="Удалить"
                    />
                  </Popconfirm>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={getNotificationIcon(notification.type)}
                      style={{ 
                        backgroundColor: notification.is_read ? '#f5f5f5' : '#fff',
                        border: `2px solid ${!notification.is_read ? getNotificationColor(notification.type) : '#d9d9d9'}`
                      }}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text 
                        strong={!notification.is_read}
                        style={{ fontSize: '16px' }}
                      >
                        {notification.title}
                      </Text>
                      <Tag 
                        color={getNotificationColor(notification.type)}
                        size="small"
                      >
                        {getNotificationTypeText(notification.type)}
                      </Tag>
                      {!notification.is_read && (
                        <Badge status="processing" />
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <Text 
                        style={{ 
                          fontSize: '14px', 
                          color: notification.is_read ? '#8c8c8c' : '#595959',
                          display: 'block',
                          marginBottom: '8px'
                        }}
                      >
                        {notification.message}
                      </Text>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text 
                          type="secondary" 
                          style={{ fontSize: '12px' }}
                        >
                          {dayjs(notification.created_at).format('DD.MM.YYYY HH:mm')}
                        </Text>
                        <Text 
                          type="secondary" 
                          style={{ fontSize: '12px' }}
                        >
                          {dayjs(notification.created_at).fromNow()}
                        </Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default Notifications;