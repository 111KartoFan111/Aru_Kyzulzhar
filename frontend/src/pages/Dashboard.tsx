// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Button,
  Alert,
  Timeline,
  Spin,
} from 'antd';
import {
  FileTextOutlined,
  FolderOutlined,
  BellOutlined,
  CalendarOutlined,
  WarningOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { contractService, documentService, notificationService, Contract, Document, Notification } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    totalDocuments: 0,
    unreadNotifications: 0,
    monthlyRevenue: 0,
  });
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load contracts
      const contractsResponse = await contractService.getAll({ limit: 100 });
      const contracts = contractsResponse.data;
      
      // Load documents
      const documentsResponse = await documentService.getAll({ limit: 100 });
      const documents = documentsResponse.data;
      
      // Load notifications
      const notificationsResponse = await notificationService.getAll({ limit: 10 });
      const notifications = notificationsResponse.data;

      // Calculate statistics
      const totalContracts = contracts.length;
      const activeContracts = contracts.filter((c: Contract) => c.status === 'active').length;
      const totalDocuments = documents.length;
      const unreadNotifications = notifications.filter((n: Notification) => !n.is_read).length;
      const monthlyRevenue = contracts
        .filter((c: Contract) => c.status === 'active')
        .reduce((sum: number, c: Contract) => sum + Number(c.rental_amount), 0);

      setStats({
        totalContracts,
        activeContracts,
        totalDocuments,
        unreadNotifications,
        monthlyRevenue,
      });

      // Set recent contracts (last 5)
      setRecentContracts(contracts.slice(0, 5));

      // Find expiring contracts (next 30 days)
      const thirtyDaysFromNow = dayjs().add(30, 'day');
      const expiring = contracts.filter((c: Contract) => 
        dayjs(c.end_date).isBefore(thirtyDaysFromNow) && 
        dayjs(c.end_date).isAfter(dayjs()) &&
        c.status === 'active'
      );
      setExpiringContracts(expiring);

      // Set recent notifications
      setRecentNotifications(notifications.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const contractColumns = [
    {
      title: 'Номер договора',
      dataIndex: 'contract_number',
      key: 'contract_number',
      render: (text: string, record: Contract) => (
        <Link to={`/contracts/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: 'Клиент',
      dataIndex: 'client_name',
      key: 'client_name',
    },
    {
      title: 'Сумма аренды',
      dataIndex: 'rental_amount',
      key: 'rental_amount',
      render: (amount: number) => `${amount.toLocaleString()} ₸`,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'active' ? 'green' : status === 'draft' ? 'orange' : 'red';
        const text = status === 'active' ? 'Активный' : status === 'draft' ? 'Черновик' : 'Завершен';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Окончание',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contract_expiry':
        return <CalendarOutlined style={{ color: '#ff4d4f' }} />;
      case 'payment_due':
        return <DollarOutlined style={{ color: '#faad14' }} />;
      case 'document_expiry':
        return <FolderOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BellOutlined style={{ color: '#52c41a' }} />;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          Добро пожаловать, {user?.full_name}!
        </Title>
        <Text type="secondary">
          Сегодня {dayjs().format('DD MMMM YYYY')}
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Всего договоров"
              value={stats.totalContracts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Активные договоры"
              value={stats.activeContracts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Документы"
              value={stats.totalDocuments}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Месячная выручка"
              value={stats.monthlyRevenue}
              suffix="₸"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts for expiring contracts */}
      {expiringContracts.length > 0 && (
        <Alert
          message="Внимание!"
          description={`${expiringContracts.length} договор(ов) истекают в ближайшие 30 дней`}
          type="warning"
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
          action={
            <Button size="small" type="link">
              <Link to="/contracts?expiring=true">Просмотреть</Link>
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Recent Contracts */}
        <Col xs={24} lg={14}>
          <Card
            title="Последние договоры"
            extra={<Link to="/contracts">Все договоры</Link>}
            style={{ height: '100%' }}
          >
            <Table
              dataSource={recentContracts}
              columns={contractColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>

        {/* Recent Notifications */}
        <Col xs={24} lg={10}>
          <Card
            title="Последние уведомления"
            extra={<Link to="/notifications">Все уведомления</Link>}
            style={{ height: '100%' }}
          >
            <Timeline
              items={recentNotifications.map((notification) => ({
                dot: getNotificationIcon(notification.type),
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{notification.title}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {dayjs(notification.created_at).format('DD.MM.YYYY HH:mm')}
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                      {notification.message}
                    </div>
                  </div>
                ),
              }))}
            />
            {recentNotifications.length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Нет уведомлений
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Expiring Contracts Table */}
      {expiringContracts.length > 0 && (
        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card title="Договоры, истекающие в ближайшие 30 дней">
              <Table
                dataSource={expiringContracts}
                columns={contractColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;