import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';
import './Admin.css';

function AdminDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAnalytics();
            setStats(response.data.data);
            setError('');
        } catch (err) {
            setError(t('common.error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner"></div>
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                {error}
                <button onClick={fetchAnalytics} className="btn btn-sm btn-outline">
                    Qayta urinish
                </button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <h1 className="admin-title">{t('admin.dashboard')}</h1>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card books animate-fade-in">
                    <div className="stat-icon-wrapper">
                        <span className="stat-icon">📚</span>
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats?.stats?.total_books || 0}</h3>
                        <p className="stat-label">{t('admin.total_books')}</p>
                    </div>
                </div>

                <div className="stat-card users animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-icon-wrapper">
                        <span className="stat-icon">👥</span>
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats?.stats?.total_users || 0}</h3>
                        <p className="stat-label">{t('admin.total_users')}</p>
                    </div>
                </div>

                <div className="stat-card downloads animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-icon-wrapper">
                        <span className="stat-icon">💾</span>
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats?.stats?.total_downloads || 0}</h3>
                        <p className="stat-label">{t('admin.total_downloads')}</p>
                    </div>
                </div>

                <div className="stat-card new-users animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="stat-icon-wrapper">
                        <span className="stat-icon">🆕</span>
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats?.stats?.new_users_month || 0}</h3>
                        <p className="stat-label">{t('admin.new_users_month')}</p>
                    </div>
                </div>
            </div>

            {/* Visual Insights Section */}
            <div className="admin-grid-two-cols">
                <div className="admin-section activity-chart-section">
                    <h2>📊 {t('admin.activity_overview')}</h2>
                    <div className="activity-chart">
                        <div className="chart-bar-container">
                            <div className="chart-bar" style={{ height: '70%' }}>
                                <span className="bar-label">{t('admin.chart_books')}</span>
                            </div>
                            <div className="chart-bar" style={{ height: '40%' }}>
                                <span className="bar-label">{t('admin.chart_users')}</span>
                            </div>
                            <div className="chart-bar primary" style={{ height: '90%' }}>
                                <span className="bar-label">{t('admin.chart_downloads')}</span>
                            </div>
                            <div className="chart-bar success" style={{ height: '55%' }}>
                                <span className="bar-label">{t('admin.chart_new')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-section">
                    <h2>🕒 {t('admin.recent_downloads')}</h2>
                    <div className="recent-activity-list">
                        {stats?.recent_downloads?.length > 0 ? (
                            stats.recent_downloads.map((log, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-icon">⬇️</div>
                                    <div className="activity-details">
                                        <p className="activity-text">
                                            <strong>{log.full_name}</strong> - <i>{log.title}</i>
                                        </p>
                                        <span className="activity-time">
                                            {new Date(log.downloaded_at).toLocaleTimeString('uz-UZ')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data-msg">{t('admin.no_data')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
