import { useState } from 'react';
import { ThemeProvider } from './lib/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';
import ClientList from './components/ClientList';
import Settings from './components/Settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--sonic-bg)] text-[var(--sonic-text)]">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 mt-16 md:mt-0 overflow-auto custom-scrollbar relative">
        {/* Decorative elements */}
        <div className="fixed top-0 right-0 w-[50vw] h-[50vh] bg-[var(--sonic-green)] opacity-[0.03] blur-[120px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[30vw] h-[30vh] bg-blue-500 opacity-[0.02] blur-[100px] pointer-events-none -z-10" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 md:p-12 lg:p-20 max-w-[1600px] mx-auto min-h-full"
          >
            {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'orders' && <OrderList />}
            {activeTab === 'new-order' && <OrderForm onSuccess={() => setActiveTab('orders')} />}
            {activeTab === 'clients' && <ClientList />}
            {activeTab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
