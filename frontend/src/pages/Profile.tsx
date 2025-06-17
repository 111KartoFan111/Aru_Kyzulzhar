// frontend/src/pages/Profile.tsx
import React from 'react';
import {
  Card,
  Descriptions,
  Typography,
  Tag,
  Avatar,
  Row,
  Col,
  Statistic,
  Button,
  Space,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Загрузка...</div>;
  }

  const getRoleTag = (role: string) => {
    const roleConfig = {
      admin: { color: 'red', text: 'Администратор' },
      manager: { color: 'blue', text: 'Менеджер' },
      user: { color: 'green', text: 'Пользователь' },
    };
    const config = roleConfig[role as keyof typeof roleConfig] || { color: 'default', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const accountAge = dayjs().diff(dayjs(user.created_at), 'day');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Профиль пользователя</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Информация о пользователе"
            extra={
              <Button
                type="primary"
                icon={<EditOutlined />}
                disabled
              >
                Редактировать
              </Button>
            }
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px' }}>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginRight: '24px' }}
              />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  {user.full_name}
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  {user.email}
                </Text>
                <div style={{ marginTop: '8px' }}>
                  {getRoleTag(user.role)}
                  <Tag color={user.is_active ? 'green' : 'red'}>
                    {user.is_active ? 'Активен' : 'Неактивен'}
                  </Tag>
                </div>
              </div>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item 
                label={<><MailOutlined /> Email</>}
              >
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item 
                label={<><UserOutlined /> Полное имя</>}
              >
                {user.full_name}
              </Descriptions.Item>
              <Descriptions.Item 
                label="Роль"
              >
                {getRoleTag(user.role)}
              </Descriptions.Item>
              <Descriptions.Item 
                label="Статус"
              >
                <Tag color={user.is_active ? 'green' : 'red'}>
                  {user.is_active ? 'Активен' : 'Неактивен'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item 
                label={<><CalendarOutlined /> Дата регистрации</>}
              >
                {dayjs(user.created_at).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item 
                label="Последнее обновление"
              >
                {dayjs(user.updated_at).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Статистика">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Statistic
                title="Дней в системе"
                value={accountAge}
                suffix="дней"
                valueStyle={{ color: '#1890ff' }}
              />
              <Statistic
                title="Последний вход"
                value={dayjs(user.updated_at).fromNow()}
                valueStyle={{ color: '#52c41a' }}
              />
            </Space>
          </Card>

          <Card title="Доступные действия" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block disabled>
                Изменить пароль
              </Button>
              <Button block disabled>
                Настройки уведомлений
              </Button>
              <Button block disabled>
                Экспорт данных
              </Button>
            </Space>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '16px', display: 'block' }}>
              * Функции редактирования профиля будут добавлены в следующих версиях
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;