import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import '@/App.css';

// Lazy load other pages
const Parties = React.lazy(() => import('./pages/Parties').then(m => ({ default: m.Parties })));
const PartyForm = React.lazy(() => import('./pages/PartyForm').then(m => ({ default: m.PartyForm })));
const Items = React.lazy(() => import('./pages/Items').then(m => ({ default: m.Items })));
const ItemForm = React.lazy(() => import('./pages/ItemForm').then(m => ({ default: m.ItemForm })));
const Leads = React.lazy(() => import('./pages/Leads').then(m => ({ default: m.Leads })));
const LeadForm = React.lazy(() => import('./pages/LeadForm').then(m => ({ default: m.LeadForm })));
const Quotations = React.lazy(() => import('./pages/Quotations').then(m => ({ default: m.Quotations })));
const QuotationForm = React.lazy(() => import('./pages/QuotationForm').then(m => ({ default: m.QuotationForm })));
const ProformaInvoices = React.lazy(() => import('./pages/ProformaInvoices').then(m => ({ default: m.ProformaInvoices })));
const ProformaForm = React.lazy(() => import('./pages/ProformaForm').then(m => ({ default: m.ProformaForm })));
const SOAList = React.lazy(() => import('./pages/SOAList').then(m => ({ default: m.SOAList })));
const SOAForm = React.lazy(() => import('./pages/SOAForm').then(m => ({ default: m.SOAForm })));
const Reports = React.lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Toaster position="top-right" richColors />
          <React.Suspense 
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              <Route path="/parties" element={<ProtectedRoute><Parties /></ProtectedRoute>} />
              <Route path="/parties/new" element={<ProtectedRoute><PartyForm /></ProtectedRoute>} />
              <Route path="/parties/:id" element={<ProtectedRoute><PartyForm /></ProtectedRoute>} />
              
              <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
              <Route path="/items/new" element={<ProtectedRoute><ItemForm /></ProtectedRoute>} />
              <Route path="/items/:id" element={<ProtectedRoute><ItemForm /></ProtectedRoute>} />
              
              <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
              <Route path="/leads/new" element={<ProtectedRoute><LeadForm /></ProtectedRoute>} />
              <Route path="/leads/:id" element={<ProtectedRoute><LeadForm /></ProtectedRoute>} />
              
              <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
              <Route path="/quotations/new" element={<ProtectedRoute><QuotationForm /></ProtectedRoute>} />
              <Route path="/quotations/:id" element={<ProtectedRoute><QuotationForm /></ProtectedRoute>} />
              
              <Route path="/proforma-invoices" element={<ProtectedRoute><ProformaInvoices /></ProtectedRoute>} />
              <Route path="/proforma-invoices/new" element={<ProtectedRoute><ProformaForm /></ProtectedRoute>} />
              <Route path="/proforma-invoices/:id" element={<ProtectedRoute><ProformaForm /></ProtectedRoute>} />
              
              <Route path="/soa" element={<ProtectedRoute><SOAList /></ProtectedRoute>} />
              <Route path="/soa/new" element={<ProtectedRoute><SOAForm /></ProtectedRoute>} />
              <Route path="/soa/:id" element={<ProtectedRoute><SOAForm /></ProtectedRoute>} />
              
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </React.Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
