// frontend/src/pages/Documents.tsx
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
  Upload,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  DatePicker,
  Tooltip,
} from 'antd';
import {
  UploadOutlined,
  SearchOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileUnknownOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { documentService, contractService, Document, Contract } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [searchText, setSearchText] = useState('');
  const [contractFilter, setContractFilter] = useState<number | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadDocuments();
    loadContracts();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAll();
      setDocuments(response.data);
    } catch (error) {
      message.error('Ошибка загрузки документов');
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await contractService.getAll();
      setContracts(response.data);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const handleUpload = async (values: any) => {
    const { file, title, description, contract_id, tags, expiry_date } = values;
    
    if (!file || !file.fileList || file.fileList.length === 0) {
      message.error('Выберите файл для загрузки');
      return;
    }

    const formData = new FormData();
    formData.append('file', file.fileList[0].originFileObj);
    formData.append('title', title);
    if (description) formData.append('description', description);
    if (contract_id) formData.append('contract_id', contract_id.toString());
    if (tags) formData.append('tags', tags);
    if (expiry_date) formData.append('expiry_date', expiry_date.format('YYYY-MM-DD'));

    try {
      setUploading(true);
      await documentService.upload(formData);
      message.success('Документ загружен успешно');
      setUploadModalVisible(false);
      uploadForm.resetFields();
      loadDocuments();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Ошибка загрузки документа');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    editForm.setFieldsValue({
      title: document.title,
      description: document.description,
      tags: document.tags?.join(', '),
      expiry_date: document.expiry_date ? dayjs(document.expiry_date) : undefined,
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editingDocument) return;

    try {
      const updateData = {
        title: values.title,
        description: values.description,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : null,
      };

      await documentService.update(editingDocument.id, updateData);
      message.success('Документ обновлен');
      setEditModalVisible(false);
      loadDocuments();
    } catch (error) {
      message.error('Ошибка обновления документа');
    }
  };

  const handleDownload = async (document: Document) => {
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

  const handleDelete = async (id: number) => {
    try {
      await documentService.delete(id);
      message.success('Документ удален');
      loadDocuments();
    } catch (error) {
      message.error('Ошибка удаления документа');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FileWordOutlined style={{ color: '#1890ff' }} />;
    if (fileType.includes('excel') || fileType.includes('sheet')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    if (fileType.includes('image')) return <FileImageOutlined style={{ color: '#722ed1' }} />;
    if (fileType.includes('text')) return <FileTextOutlined style={{ color: '#faad14' }} />;
    return <FileUnknownOutlined style={{ color: '#8c8c8c' }} />;
  };

  const getContractName = (contractId: number) => {
    const contract = contracts.find(c => c.id === contractId);
    return contract ? contract.contract_number : 'Не указан';
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = dayjs(expiryDate).diff(dayjs(), 'day');
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return dayjs(expiryDate).isBefore(dayjs());
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         (document.description && document.description.toLowerCase().includes(searchText.toLowerCase())) ||
                         (document.tags && document.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase())));
    const matchesContract = !contractFilter || document.contract_id === contractFilter;
    return matchesSearch && matchesContract;
  });

  const columns = [
    {
      title: 'Файл',
      key: 'file',
      width: 60,
      render: (record: Document) => (
        <Tooltip title={record.file_type}>
          {getFileIcon(record.file_type)}
        </Tooltip>
      ),
    },
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: 'Договор',
      dataIndex: 'contract_id',
      key: 'contract_id',
      render: (contractId: number) => (
        contractId ? (
          <Tag color="blue">{getContractName(contractId)}</Tag>
        ) : (
          <Tag color="default">Общий</Tag>
        )
      ),
    },
    {
      title: 'Теги',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <div>
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags?.length > 2 && <Tag size="small">+{tags.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: 'Срок действия',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (date: string) => {
        if (!date) return '-';
        
        const isExpiring = isExpiringSoon(date);
        const expired = isExpired(date);
        
        return (
          <Tag color={expired ? 'red' : isExpiring ? 'orange' : 'green'}>
            {dayjs(date).format('DD.MM.YYYY')}
          </Tag>
        );
      },
    },
    {
      title: 'Загружен',
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
            onClick={() => handleDownload(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Удалить документ?"
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
        <Title level={2}>Документы</Title>
      </div>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Поиск по названию, описанию, тегам"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Фильтр по договору"
              value={contractFilter}
              onChange={setContractFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {contracts.map(contract => (
                <Option key={contract.id} value={contract.id}>
                  {contract.contract_number}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              Загрузить документ
            </Button>
          </Col>
        </Row>

        <Table
          dataSource={filteredDocuments}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} документов`,
          }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Загрузить документ"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
        }}
        onOk={() => uploadForm.submit()}
        confirmLoading={uploading}
        width={600}
        destroyOnClose
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUpload}
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
                name="contract_id"
                label="Связанный договор"
              >
                <Select placeholder="Выберите договор" allowClear>
                  {contracts.map(contract => (
                    <Option key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.client_name}
                    </Option>
                  ))}
                </Select>
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

          <Form.Item
            name="tags"
            label="Теги"
          >
            <Input placeholder="паспорт, документы, клиент (через запятую)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Редактировать документ"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => editForm.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="title"
            label="Название документа"
            rules={[{ required: true, message: 'Введите название документа' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tags"
                label="Теги"
              >
                <Input placeholder="через запятую" />
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
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Documents;