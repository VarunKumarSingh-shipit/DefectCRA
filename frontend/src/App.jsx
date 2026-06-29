import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import ApiKeyModal from './components/ApiKeyModal';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import FiveWhyPage from './pages/FiveWhyPage';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />
        <ApiKeyModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/five-why" element={<FiveWhyPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
