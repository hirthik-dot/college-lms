import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function PageWrapper({ children }) {
    return (
        <div className="min-h-screen bg-surface-50">
            <Sidebar />
            <Navbar />
            <main
                className="pt-[var(--navbar-height)] min-h-screen"
                style={{ marginLeft: 'var(--sidebar-width)' }}
            >
                <div className="p-6 animate-fade-in">{children}</div>
            </main>
        </div>
    );
}
