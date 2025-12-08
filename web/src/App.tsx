import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary, Header, Sidebar, Viewer } from '@/components';
import { PrintPage } from '@/pages';

function MainView() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <Viewer />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainView />} />
          <Route path="/print" element={<PrintPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
