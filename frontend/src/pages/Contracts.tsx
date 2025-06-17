// frontend/src/pages/Contracts.tsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { contractService, Contract, ContractCreate } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await contractService.getAll();
      setContracts(response.data);
    } catch (error) {
      message.error('Ошибка загрузки договоров');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingContract(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    form.setFieldsValue({
      ...contract,
      start_date: dayjs(contract.start_date),
      end_date: dayjs(contract.end_date),
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const data: ContractCreate = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
      };

      if (editingContract) {
        await contractService.update(editingContract.id, data);
        message.success('Договор обновлен');
      } else {
        await contractService.create(data);
        message.success('Договор создан');
      }

      setModalVisible(false);
      loadContracts();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Ошибка сохранения договора');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await contractService.delete(id);
      message.success('Договор удален');
      loadContracts();
    } catch (error) {
      message.error('Ошибка удаления договора');
    }
  };

  const handleDownload = async (contract: Contract) => {
    try {
      const response = await contractService.download(contract.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${contract.contract_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Ошибка скачивания договора');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.client_name.toLowerCase().includes(searchText.toLowerCase()) ||
                         contract.contract_number.toLowerCase().includes(searchText.toLowerCase()) ||
                         contract.property_address.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
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
      title: 'Адрес объекта',
      dataIndex: 'property_address',
      key: 'property_address',
      ellipsis: true,
    },
    {
      title: 'Тип',
      dataIndex: 'property_type',
      key: 'property_type',
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
        const statusConfig = {
          active: { color: 'green', text: 'Активный' },
          draft: { color: 'orange', text: 'Черновик' },
          completed: { color: 'blue', text: 'Завершен' },
          terminated: { color: 'red', text: 'Расторгнут' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Период',
      key: 'period',
      render: (record: Contract) => (
        <div>
          <div>{dayjs(record.start_date).format('DD.MM.YYYY')} -</div>
          <div>{dayjs(record.end_date).format('DD.MM.YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: Contract) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/contracts/${record.id}`, '_blank')}
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Удалить договор?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Договоры аренды</Title>
      </div>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Поиск по клиенту, номеру договора, адресу"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Статус"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">Активный</Option>
              <Option value="draft">Черновик</Option>
              <Option value="completed">Завершен</Option>
              <Option value="terminated">Расторгнут</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={12} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Создать договор
            </Button>
          </Col>
        </Row>

        <Table
          dataSource={filteredContracts}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} договоров`,
          }}
        />
      </Card>

      <Modal
        title={editingContract ? 'Редактировать договор' : 'Создать договор'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="client_name"
                label="Имя клиента"
                rules={[{ required: true, message: 'Введите имя клиента' }]}
              >
                <Input placeholder="Иван Иванов" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="client_phone"
                label="Телефон клиента"
              >
                <Input placeholder="+7 777 123 4567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="client_email"
                label="Email клиента"
                rules={[{ type: 'email', message: 'Некорректный email' }]}
              >
                <Input placeholder="client@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="property_type"
                label="Тип недвижимости"
                rules={[{ required: true, message: 'Выберите тип недвижимости' }]}
              >
                <Select placeholder="Выберите тип">
                  <Option value="квартира">Квартира</Option>
                  <Option value="офис">Офис</Option>
                  <Option value="торговое помещение">Торговое помещение</Option>
                  <Option value="склад">Склад</Option>
                  <Option value="гараж">Гараж</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="property_address"
            label="Адрес недвижимости"
            rules={[{ required: true, message: 'Введите адрес' }]}
          >
            <Input placeholder="г. Алматы, ул. Абая, 123, кв. 45" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="rental_amount"
                label="Сумма аренды (₸)"
                rules={[{ required: true, message: 'Введите сумму аренды' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="150000"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deposit_amount"
                label="Залоговая сумма (₸)"
                rules={[{ required: true, message: 'Введите размер залога' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="150000"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Дата начала"
                rules={[{ required: true, message: 'Выберите дату начала' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label="Дата окончания"
                rules={[{ required: true, message: 'Выберите дату окончания' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Contracts;