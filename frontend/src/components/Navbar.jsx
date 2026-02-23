import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import logo from '../assets/uni-logo.png';
import './Navbar.css';
import { useState, useEffect, useRef } from 'react';

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [search, setSearch] = useState('');
    const searchRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 992);
            if (window.innerWidth > 992) {
                setIsMenuOpen(false);
            }
        };

        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/books?search=${encodeURIComponent(search.trim())}`);
            setIsSearchOpen(false);
            setSearch('');
            setIsMenuOpen(false);
        }
    };

    const isActive = (path) => {
        return location.pathname === path ? 'nav-link active' : 'nav-link';
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container-fluid">
                <div className="navbar-content">
                    {/* Left: Logo */}
                    <Link to="/" className="navbar-logo">
                        <img src={logo} alt="University Logo" className="logo-img" />
                        <span className="logo-text">KUTUBXONA</span>
                    </Link>

                    {/* Mobile Menu Button */}
                    {isMobile && (
                        <button className="mobile-menu-btn" onClick={toggleMenu}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isMenuOpen ? <line x1="18" y1="6" x2="6" y2="18"></line> : <line x1="3" y1="12" x2="21" y2="12"></line>}
                                {isMenuOpen ? <line x1="6" y1="6" x2="18" y2="18"></line> : <line x1="3" y1="6" x2="21" y2="6"></line>}
                                {!isMenuOpen && <line x1="3" y1="18" x2="21" y2="18"></line>}
                            </svg>
                        </button>
                    )}

                    {/* Navbar Menu */}
                    <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                        {/* Center: Navigation Links */}
                        {isAuthenticated && (
                            <div className="nav-center">
                                <Link to="/" className={isActive('/')} onClick={() => setIsMenuOpen(false)}>
                                    {t('nav.home')}
                                </Link>
                                <Link to="/books" className={isActive('/books')} onClick={() => setIsMenuOpen(false)}>
                                    {t('nav.books')}
                                </Link>
                                <Link to="/library" className={isActive('/library')} onClick={() => setIsMenuOpen(false)}>
                                    {t('nav.library')}
                                </Link>
                                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                    <Link to="/admin" className={`admin-link ${isActive('/admin')}`} onClick={() => setIsMenuOpen(false)}>
                                        {t('nav.admin')}
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Right: Auth & Search */}
                        <div className="nav-right">
                            <div ref={searchRef} className={`nav-search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                                <form onSubmit={handleSearch} className="nav-search-form">
                                    <input
                                        type="text"
                                        placeholder={t('nav.search_placeholder')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="nav-search-input"
                                    />
                                    <button type="submit" className="nav-search-submit">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                    </button>
                                </form>
                                <button className="nav-search-toggle" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </button>
                            </div>

                            <LanguageSwitcher />

                            <div className="auth-buttons">
                                {isAuthenticated ? (
                                    <div className="profile-dropdown-wrapper">
                                        <Link
                                            to="/profile"
                                            className="profile-toggle-btn"
                                            title={t('profile.title')}
                                        >
                                            <div className="profile-icon-wrapper">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                            </div>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="guest-actions">
                                        <Link to="/login" className="btn-login" onClick={() => setIsMenuOpen(false)}>
                                            {t('nav.login')}
                                        </Link>
                                        <Link to="/register" className="btn-register" onClick={() => setIsMenuOpen(false)}>
                                            {t('nav.register')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
