// frontend/src/pages/ContractDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Typography,
  Spin,
  message,
  Table,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { contractService, documentService, Contract, Document } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadContractData(parseInt(id));
    }
  }, [id]);

  const loadContractData = async (contractId: number) => {
    try {
      setLoading(true);
      
      // Load contract details
      const contractResponse = await contractService.getById(contractId);
      setContract(contractResponse.data);

      // Load related documents
      const documentsResponse = await documentService.getAll({ contract_id: contractId });
      setDocuments(documentsResponse.data);
    } catch (error) {
      message.error('Ошибка загрузки данных договора');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContract = async () => {
    if (!contract) return;
    
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

  const handleDocumentUpload = async (values: any) => {
    const { file, title, description, tags, expiry_date } = values;
    
    if (!file || !file.fileList || file.fileList.length === 0) {
      message.error('Выберите файл для загрузки');
      return;
    }

    const formData = new FormData();
    formData.append('file', file.fileList[0].originFileObj);
    formData.append('title', title);
    if (description) formData.append('description', description);
    if (contract) formData.append('contract_id', contract.id.toString());
    if (tags) formData.append('tags', tags);
    if (expiry_date) formData.append('expiry_date', expiry_date.format('YYYY-MM-DD'));

    try {
      setUploading(true);
      await documentService.upload(formData);
      message.success('Документ загружен успешно');
      setUploadModalVisible(false);
      form.resetFields();
      if (contract) loadContractData(contract.id);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Ошибка загрузки документа');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentDownload = async (document: Document) => {
    try {
      const response = await documentService.download(document.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Ошибка скачивания документа');
    }
  };

  const handleDocumentDelete = async (documentId: number) => {
    try {
      await documentService.delete(documentId);
      message.success('Документ удален');
      if (contract) loadContractData(contract.id);
    } catch (error) {
      message.error('Ошибка удаления документа');
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      active: { color: 'green', text: 'Активный' },
      draft: { color: 'orange', text: 'Черновик' },
      completed: { color: 'blue', text: 'Завершен' },
      terminated: { color: 'red', text: 'Расторгнут' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const documentColumns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Теги',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <div>
          {tags?.map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Дата загрузки',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: Document) => (
        <Space>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => handleDocumentDownload(record)}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDocumentDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!contract) {
    return <div>Договор не найден</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/contracts')}
          >
            Назад к договорам
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Договор {contract.contract_number}
          </Title>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Информация о договоре"
            extra={
              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadContract}
                >
                  Скачать PDF
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/contracts`)}
                >
                  Редактировать
                </Button>
              </Space>
            }
          >
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Номер договора">
                {contract.contract_number}
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                {getStatusTag(contract.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Клиент">
                {contract.client_name}
              </Descriptions.Item>
              <Descriptions.Item label="Телефон клиента">
                {contract.client_phone || 'Не указан'}
              </Descriptions.Item>
              <Descriptions.Item label="Email клиента">
                {contract.client_email || 'Не указан'}
              </Descriptions.Item>
              <Descriptions.Item label="Адрес объекта">
                {contract.property_address}
              </Descriptions.Item>
              <Descriptions.Item label="Тип недвижимости">
                {contract.property_type}
              </Descriptions.Item>
              <Descriptions.Item label="Сумма аренды">
                {contract.rental_amount.toLocaleString()} ₸ / месяц
              </Descriptions.Item>
              <Descriptions.Item label="Залоговая сумма">
                {contract.deposit_amount.toLocaleString()} ₸
              </Descriptions.Item>
              <Descriptions.Item label="Период аренды">
                {dayjs(contract.start_date).format('DD.MM.YYYY')} - {dayjs(contract.end_date).format('DD.MM.YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Дата создания">
                {dayjs(contract.created_at).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Последнее обновление">
                {dayjs(contract.updated_at).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Статистика договора">
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text type="secondary">Дней до окончания</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {dayjs(contract.end_date).diff(dayjs(), 'day')}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <Text type="secondary">Общая стоимость</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                  {((contract.rental_amount * dayjs(contract.end_date).diff(dayjs(contract.start_date), 'month', true)) + contract.deposit_amount).toLocaleString()} ₸
                </div>
              </div>
              <div>
                <Text type="secondary">Документов прикреплено</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
                  {documents.length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="Связанные документы"
        style={{ marginTop: '16px' }}
        extra={
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Загрузить документ
          </Button>
        }
      >
        <Table
          dataSource={documents}
          columns={documentColumns}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: 'Нет загруженных документов'
          }}
        />
      </Card>

      <Modal
        title="Загрузить документ"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDocumentUpload}
        >
          <Form.Item
            name="file"
            label="Файл"
            rules={[{ required: true, message: 'Выберите файл для загрузки' }]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
            >
              <Button icon={<UploadOutlined />}>Выберите файл</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="title"
            label="Название документа"
            rules={[{ required: true, message: 'Введите название документа' }]}
          >
            <Input placeholder="Например: Паспорт клиента" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Краткое описание документа"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tags"
                label="Теги"
              >
                <Input placeholder="паспорт, документы, клиент" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiry_date"
                label="Срок действия"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder="Выберите дату"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractDetail;