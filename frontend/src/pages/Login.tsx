// frontend/src/pages/Login.tsx
import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Spin, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();

  useEffect(() => {
    // Auto-fill demo credentials for testing
    form.setFieldsValue({
      email: 'admin@kyzylzhar.kz',
      password: 'admin123',
    });
  }, [form]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (values: LoginForm) => {
    await login(values.email, values.password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            }}
            bodyStyle={{ padding: '40px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <HomeOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={2} style={{ margin: 0, color: '#001529' }}>
                Кызыл Жар
              </Title>
              <Text type="secondary">
                Система управления документооборотом
              </Text>
            </div>

            <Spin spinning={loading}>
              <Form
                form={form}
                name="login"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Введите email' },
                    { type: 'email', message: 'Некорректный email' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="your@email.com"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Пароль"
                  rules={[{ required: true, message: 'Введите пароль' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Ваш пароль"
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: '8px' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    style={{ height: '48px', fontSize: '16px' }}
                  >
                    Войти
                  </Button>
                </Form.Item>
              </Form>
            </Spin>

            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              background: '#f5f5f5', 
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666',
            }}>
              <Text strong>Демо учетные записи:</Text>
              <div style={{ marginTop: '8px' }}>
                <div>👑 Админ: admin@kyzylzhar.kz / admin123</div>
                <div>📋 Менеджер: manager@kyzylzhar.kz / manager123</div>
                <div>👤 Пользователь: user@kyzylzhar.kz / user123</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;