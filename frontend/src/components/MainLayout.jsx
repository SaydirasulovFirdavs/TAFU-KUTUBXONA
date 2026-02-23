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
                    <p>&copy; {new Date().getFullYear()} KUTUBXONA. Barcha huquqlar himoyalangan.</p>
                </div>
            </footer>
        </div>
    );
}

export default MainLayout;
