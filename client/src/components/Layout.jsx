import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>
      <Sidebar />
      <main className="main-content transition-all duration-300 mx-auto px-4 py-6 pt-16 lg:pt-6" style={{ maxWidth: '72rem' }}>
        {children}
      </main>
    </div>
  );
}
