import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Operations } from './pages/Operations';
import { StockLedger } from './pages/StockLedger';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState<any>({}); // Store params like { filter: 'lowStock' }

  // Enhanced navigation handler
  const handleNavigate = (page: string, params?: any) => {
    if (page === 'login') {
        logout();
        return;
    }
    setCurrentPage(page);
    if (params) {
        setPageParams(params);
    } else {
        setPageParams({}); // Reset params on clean navigation
    }
    // Scroll to top on nav
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-stone-50">
              <Loader2 className="animate-spin text-violet-600" size={48} />
          </div>
      );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': 
        return <Dashboard onNavigate={handleNavigate} />;
      case 'products': 
        return <Products initialParams={pageParams} />;
      case 'operations': 
        return <Operations initialParams={pageParams} />;
      case 'ledger': 
        return <StockLedger />;
      case 'settings': 
        return <Settings />;
      default: 
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <InventoryProvider>
      <Layout activePage={currentPage} onNavigate={(page) => handleNavigate(page)}>
        {renderPage()}
      </Layout>
    </InventoryProvider>
  );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
