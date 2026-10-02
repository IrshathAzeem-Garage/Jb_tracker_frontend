import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useBackendHealth } from './hooks/useBackendHealth';

// Lazy-loaded pages for mobile performance optimization
const Orders = lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const OrderDetail = lazy(() => import('./pages/OrderDetail').then(m => ({ default: m.OrderDetail })));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail').then(m => ({ default: m.CustomerDetail })));
const Suppliers = lazy(() => import('./pages/Suppliers').then(m => ({ default: m.Suppliers })));
const SupplierDetail = lazy(() => import('./pages/SupplierDetail').then(m => ({ default: m.SupplierDetail })));
const Products = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const Money = lazy(() => import('./pages/Money').then(m => ({ default: m.Money })));
const Expenses = lazy(() => import('./pages/Expenses').then(m => ({ default: m.Expenses })));
const Partners = lazy(() => import('./pages/Partners').then(m => ({ default: m.Partners })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const RouteSuspense = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-[50vh] p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Loading...
          </span>
        </div>
      </div>
    }
  >
    {children}
  </Suspense>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-white rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            JB Tracker
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const BackendWarmup = () => {
  useBackendHealth();
  return null;
};

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BackendWarmup />
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
              {/* Public Auth */}
              <Route path="/login" element={<Login />} />

              {/* Protected Workspace */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders" element={<RouteSuspense><Orders /></RouteSuspense>} />
                <Route path="orders/:id" element={<RouteSuspense><OrderDetail /></RouteSuspense>} />
                <Route path="customers" element={<RouteSuspense><Customers /></RouteSuspense>} />
                <Route path="customers/:id" element={<RouteSuspense><CustomerDetail /></RouteSuspense>} />
                <Route path="suppliers" element={<RouteSuspense><Suppliers /></RouteSuspense>} />
                <Route path="suppliers/:id" element={<RouteSuspense><SupplierDetail /></RouteSuspense>} />
                <Route path="products" element={<RouteSuspense><Products /></RouteSuspense>} />
                <Route path="money" element={<RouteSuspense><Money /></RouteSuspense>} />
                <Route path="expenses" element={<RouteSuspense><Expenses /></RouteSuspense>} />
                <Route path="partners" element={<RouteSuspense><Partners /></RouteSuspense>} />
                <Route path="reports" element={<RouteSuspense><Reports /></RouteSuspense>} />
                <Route path="reports/:reportType" element={<RouteSuspense><Reports /></RouteSuspense>} />
                <Route path="settings" element={<RouteSuspense><Settings /></RouteSuspense>} />
              </Route>

              {/* Fallback 404 */}
              <Route path="*" element={<RouteSuspense><NotFound /></RouteSuspense>} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
}

export default App;
