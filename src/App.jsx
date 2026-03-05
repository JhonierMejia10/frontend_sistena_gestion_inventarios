import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import OrdenesVenta from './pages/OrdenesVenta';
import OrdenesCompra from './pages/OrdenesCompra';
import Movimientos from './pages/Movimientos';
import Login from './pages/Login';
import Configuracion from './pages/Configuracion';
import Pagos from './pages/Pagos';
import Pedidos from './pages/Pedidos';

// Create a dark theme instance customized for Inventario Pro
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10b981', // green-accent
    },
    background: {
      default: '#0a0a0a',
      paper: '#121212',
    },
    text: {
      primary: '#fafafa',
      secondary: '#a1a1aa',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #27272a',
            }
          }} />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes Wrapper */}
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="productos" element={<Productos />} />
              <Route path="ventas" element={<OrdenesVenta />} />
              <Route path="compras" element={<OrdenesCompra />} />
              <Route path="movimientos" element={<Movimientos />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="pagos" element={<Pagos />} />
              <Route path="pedidos" element={<Pedidos />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

