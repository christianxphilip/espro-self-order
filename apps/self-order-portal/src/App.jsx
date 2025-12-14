import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QRScanPage from './pages/QRScanPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import ConfirmationPage from './pages/ConfirmationPage';
import OrderSubmittedPage from './pages/OrderSubmittedPage';
import OrderHistoryPage from './pages/OrderHistoryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/scan/:qrCode" element={<QRScanPage />} />
          <Route path="/order/table/:tableId" element={<MenuPage />} />
          <Route path="/cart/:tableId" element={<CartPage />} />
          <Route path="/confirm/:tableId" element={<ConfirmationPage />} />
          <Route path="/order-submitted/:orderId" element={<OrderSubmittedPage />} />
          <Route path="/history" element={<OrderHistoryPage />} />
          <Route path="/" element={<div className="p-8 text-center">ESPRO Self Order - Scan QR Code to Start</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
