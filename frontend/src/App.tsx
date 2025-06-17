import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import { AuthProvider } from './contexts/AuthContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Layout from './components/Layout.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Contracts from './pages/Contracts.tsx';
import ContractDetail from './pages/ContractDetail.tsx';
import Documents from './pages/Documents.tsx';
import Notifications from './pages/Notifications.tsx';
import Profile from './pages/Profile.tsx';

import './App.css';

// Set dayjs locale to Russian
dayjs.locale('ru');

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    colorBgContainer: '#ffffff',
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
    },
  },
};

function App() {
  return (
    <ConfigProvider locale={ruRU} theme={theme}>
      <AntApp>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/contracts" element={<Contracts />} />
                          <Route path="/contracts/:id" element={<ContractDetail />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/profile" element={<Profile />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;