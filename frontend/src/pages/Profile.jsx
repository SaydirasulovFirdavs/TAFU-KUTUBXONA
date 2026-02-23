import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function Profile() {
    const { t } = useTranslation();
    const { user, setUser, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'security'

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            const userData = response.data.data;
            setFormData(prev => ({
                ...prev,
                full_name: userData.full_name,
                email: userData.email,
                role: userData.role_id === 2 ? 'Admin' : userData.role_id === 3 ? 'Super Admin' : 'Foydalanuvchi'
            }));
        } catch (err) {
            console.error(err);
            setError('Profil ma\'lumotlarini yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        if (formData.new_password) {
            if (!formData.current_password) {
                setError('Parolni o\'zgartirish uchun joriy parolni kiriting');
                setSaving(false);
                return;
            }
            if (formData.new_password !== formData.confirm_password) {
                setError('Yangi parollar mos kelmadi');
                setSaving(false);
                return;
            }
            if (formData.new_password.length < 6) {
                setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
                setSaving(false);
                return;
            }
        }

        try {
            const updateData = {
                full_name: formData.full_name
            };

            if (formData.new_password) {
                updateData.current_password = formData.current_password;
                updateData.new_password = formData.new_password;
            }

            const response = await userAPI.updateProfile(updateData);
            setSuccess(response.data.message || 'Profil muvaffaqiyatli yangilandi');

            setUser(prev => ({
                ...prev,
                full_name: formData.full_name
            }));

            setFormData(prev => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Saqlashda xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Get role color
    const getRoleColor = (role) => {
        switch (role) {
            case 'Super Admin': return '#8b5cf6';
            case 'Admin': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    if (loading) {
        return (
            <div className="profile-page-pro">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-pro">
            <div className="profile-container">
                {/* Left Side - Profile Card */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-large">
                            {getInitials(formData.full_name)}
                        </div>
                        <h2 className="profile-name">{formData.full_name}</h2>
                        <span
                            className="profile-role-badge"
                            style={{ backgroundColor: getRoleColor(formData.role) }}
                        >
                            {formData.role}
                        </span>
                        <p className="profile-email">{formData.email}</p>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                            <span>Kitoblarim</span>
                        </div>
                        <div className="stat-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Yuklanmalar</span>
                        </div>
                        <div className="stat-item logout-sidebar-item" onClick={logout}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <span>{t('nav.logout') || 'Chiqish'}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Settings Form */}
                <div className="profile-content">
                    {/* Tabs */}
                    <div className="profile-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Shaxsiy ma'lumotlar
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Xavfsizlik
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="alert-pro alert-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="alert-pro alert-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {activeTab === 'info' && (
                            <div className="form-section">
                                <h3 className="section-title">Asosiy ma'lumotlar</h3>

                                <div className="form-group-pro">
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        To'liq ism
                                    </label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className="input-pro"
                                        placeholder="Ismingizni kiriting"
                                        required
                                    />
                                </div>

                                <div className="form-group-pro">
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        className="input-pro disabled"
                                        disabled
                                    />
                                    <span className="input-hint">Email manzilini o'zgartirish mumkin emas</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="form-section">
                                <h3 className="section-title">Parolni o'zgartirish</h3>
                                <p className="section-desc">Hisobingizni himoya qilish uchun kuchli parol tanlang</p>

                                <div className="form-group-pro">
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                        Joriy parol
                                    </label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        value={formData.current_password}
                                        onChange={handleChange}
                                        className="input-pro"
                                        placeholder="Joriy parolingizni kiriting"
                                    />
                                </div>

                                <div className="form-row-pro">
                                    <div className="form-group-pro">
                                        <label>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                            </svg>
                                            Yangi parol
                                        </label>
                                        <input
                                            type="password"
                                            name="new_password"
                                            value={formData.new_password}
                                            onChange={handleChange}
                                            className="input-pro"
                                            placeholder="Yangi parol"
                                        />
                                    </div>
                                    <div className="form-group-pro">
                                        <label>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            Parolni tasdiqlang
                                        </label>
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            className="input-pro"
                                            placeholder="Parolni qaytadan kiriting"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-actions-pro">
                            <button
                                type="submit"
                                className="btn-save-pro"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                            <polyline points="7 3 7 8 15 8"></polyline>
                                        </svg>
                                        O'zgarishlarni saqlash
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Profile;
