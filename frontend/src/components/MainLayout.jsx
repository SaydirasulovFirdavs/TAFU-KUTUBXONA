import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './MainLayout.css';
function MainLayout() {
    return (
        <div className="main-layout">
            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>

            <footer className="main-footer">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} KUTUBXONA. Barcha huquqlar himoyalangan. <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>v1.1 - Mobile Fixed</span></p>
                </div>
            </footer>
        </div>
    );
}

export default MainLayout;
