import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import LanguageSwitcher from '../components/LanguageSwitcher';
import authHero from '../assets/auth-hero.png';
import uniLogo from '../assets/uni-logo.png';
import './Auth.css';

function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const loginToast = toast.loading(t('auth.logging_in') || 'Logging in...');
        const result = await login(email, password);

        if (result.success) {
            toast.success(t('auth.success_login') || 'Muvaffaqiyatli kirdingiz!', { id: loginToast });
            if (result.user.role === 'admin' || result.user.role === 'super_admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } else {
            toast.error(result.message || 'Xatolik yuz berdi', { id: loginToast });
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-illustration-wrapper">
                    <img src={authHero} alt="Education Illustration" className="auth-illustration" />
                </div>
            </div>

            <div className="auth-right">

                <div className="auth-lang-wrapper">
                    <LanguageSwitcher />
                </div>

                <div className="auth-container">
                    <div className="university-branding animate-fade-in">
                        <div className="uni-logo-wrapper">
                            <img src={uniLogo} alt="University Logo" className="uni-logo-img" />
                        </div>
                        <h1 className="university-name">
                            Toshkent Amaliy Fanlar Universiteti
                        </h1>
                    </div>

                    <div className="auth-content w-100 animate-fade-in">
                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && (
                                <div className="alert alert-error mb-4">
                                    <span>⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="auth-input-group">
                                <span className="auth-input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </span>
                                <input
                                    type="email"
                                    placeholder={t('auth.email_label') || "Login"}
                                    className="auth-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="auth-input-group">
                                <span className="auth-input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t('auth.password_label') || "Password"}
                                    className="auth-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {showPassword ? (
                                            <>
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </>
                                        ) : (
                                            <>
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="auth-submit-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        <span>{t('auth.logging_in')}</span>
                                    </>
                                ) : (
                                    <>
                                        {t('auth.login_btn')}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 16 16 12 12 8"></polyline>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                    </>
                                )}
                            </button>

                            <div className="auth-footer text-center">
                                {t('auth.no_account')} {' '}
                                <Link to="/register">{t('auth.register_btn')}</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
