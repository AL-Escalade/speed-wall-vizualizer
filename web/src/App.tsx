import { ErrorBoundary, Header, Sidebar, Viewer } from '@/components';

function App() {
  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex min-h-0">
          <Sidebar />
          <Viewer />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
