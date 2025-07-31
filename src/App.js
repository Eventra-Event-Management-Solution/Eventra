import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Event Pages
import Events from './pages/events/Events';
import EventDetail from './pages/events/EventDetail';
import CreateEvent from './pages/events/CreateEvent';
import EditEvent from './pages/events/EditEvent';

// Client Pages
import Clients from './pages/clients/Clients';
import ClientDetail from './pages/clients/ClientDetail';
import CreateClient from './pages/clients/CreateClient';
import EditClient from './pages/clients/EditClient';

// Vendor Pages
import Vendors from './pages/vendors/Vendors';
import VendorDetail from './pages/vendors/VendorDetail';
import CreateVendor from './pages/vendors/CreateVendor';
import EditVendor from './pages/vendors/EditVendor';

// Invoice Pages
import Invoices from './pages/invoices/Invoices';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import CreateInvoice from './pages/invoices/CreateInvoice';
import EditInvoice from './pages/invoices/EditInvoice';



// Other Pages
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      
      {/* Dashboard Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/edit" element={<EditEvent />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/create" element={<CreateClient />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="clients/:id/edit" element={<EditClient />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="vendors/create" element={<CreateVendor />} />
         <Route path="vendors/:id" element={<VendorDetail />} />
         <Route path="vendors/:id/edit" element={<EditVendor />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/create" element={<CreateInvoice />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="invoices/:id/edit" element={<EditInvoice />} />

      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;