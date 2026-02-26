import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { booksAPI, API_URL } from '../services/api';
import Skeleton from '../components/Skeleton';
import logo from '../assets/uni-logo.png';
import './Home.css';

function Home() {
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [featuredBooks, setFeaturedBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedBooks();
    }, []);

    const fetchFeaturedBooks = async () => {
        try {
            setLoading(true);
            const response = await booksAPI.getAll({ limit: 4 });
            setFeaturedBooks(response.data.data.books || []);
        } catch (err) {
            console.error('Error fetching featured books:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page">
            {/* Background Elements */}

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-grid">
                        <div className="hero-content animate-fade-in">
                            <h1 className="hero-title">
                                <Trans i18nKey="home.hero_title">
                                    <span className="gradient-text">Bilim olami</span> <br />
                                    <span className="text-white">bir marta bosishda</span>
                                </Trans>
                            </h1>
                            <p className="hero-description">
                                {t('home.hero_desc')}
                            </p>

                            <div className="hero-actions">
                                {isAuthenticated ? (
                                    <>
                                        <Link to="/books" className="btn btn-primary btn-lg">
                                            <span>{t('nav.books')}</span>
                                            <span>→</span>
                                        </Link>
                                        <Link to="/library" className="btn btn-secondary btn-lg">
                                            <span>{t('nav.library')}</span>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/register" className="btn btn-primary btn-lg">
                                            <span>{t('home.start_btn')}</span>
                                            <span>🚀</span>
                                        </Link>
                                        <Link to="/login" className="btn btn-outline btn-lg">
                                            <span>{t('home.login_btn')}</span>
                                        </Link>
                                    </>
                                )}
                            </div>

                            <div className="hero-stats">
                                <div className="hero-stat-item">
                                    <span className="stat-value">10k+</span>
                                    <span className="stat-label">{t('home.stats_books')}</span>
                                </div>
                                <div className="hero-stat-item">
                                    <span className="stat-value">5k+</span>
                                    <span className="stat-label">{t('home.stats_readers')}</span>
                                </div>
                                <div className="hero-stat-item">
                                    <span className="stat-value">4.9</span>
                                    <span className="stat-label">{t('home.stats_rating')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-logo-svg-container">
                            <svg
                                viewBox="0 0 340 340"
                                className="hero-logo-svg"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Top Row: 3 Squares */}
                                <rect x="0" y="0" width="100" height="100" rx="16" fill="currentColor" />
                                <rect x="120" y="0" width="100" height="100" rx="16" fill="currentColor" />
                                <rect x="240" y="0" width="100" height="100" rx="16" fill="currentColor" />

                                {/* Bottom Row: 1 Square (Centered) */}
                                <rect x="120" y="120" width="100" height="100" rx="16" fill="currentColor" />
                            </svg>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Books Section */}
            <section className="featured-books">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">{t('home.featured_books_title')}</h2>
                    </div>

                    {loading ? (
                        <div className="featured-grid">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="featured-book-skeleton">
                                    <Skeleton type="image" height="280px" />
                                    <Skeleton type="title" width="80%" />
                                    <Skeleton type="text" width="60%" />
                                </div>
                            ))}
                        </div>
                    ) : featuredBooks.length > 0 ? (
                        <div className="featured-grid">
                            {featuredBooks.map((book, index) => (
                                <Link
                                    to={`/books/${book.id}`}
                                    key={book.id}
                                    className={`book-preview-card glass animate-fade-in animate-delay-${index + 1}`}
                                >
                                    <div className="book-preview-cover">
                                        {book.cover_image ? (
                                            <img
                                                src={book.cover_image.startsWith('http')
                                                    ? book.cover_image
                                                    : `${API_URL.endsWith('/api') ? API_URL.replace('/api', '') : API_URL}/${book.cover_image.replace(/\\/g, '/')}`}
                                                alt={book.title}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/300x400?text=No+Cover';
                                                }}
                                            />
                                        ) : (
                                            <div className="book-preview-placeholder">📖</div>
                                        )}
                                        <div className="book-preview-overlay">
                                            <span className="view-details-tag">Ko'rish</span>
                                        </div>
                                    </div>
                                    <div className="book-preview-info">
                                        <h3 className="book-preview-title">{book.title}</h3>
                                        <p className="book-preview-author">{book.author_name || t('books_page.unknown_author')}</p>
                                        <div className="book-preview-meta">
                                            <span className="tag">{book.language_name}</span>
                                            {book.rating_avg > 0 && <span className="rating">⭐ {Number(book.rating_avg).toFixed(1)}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-featured">
                            <p>{t('home.no_featured_books') || 'Hozircha kitoblar mavjud emas'}</p>
                        </div>
                    )}

                    <div className="featured-actions">
                        <Link to="/books" className="show-all-btn btn btn-outline btn-lg">
                            <span>{t('home.view_all_btn')}</span>
                            <span className="arrow">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">{t('home.features_title')}</h2>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card animate-delay-1">
                            <div className="feature-icon-wrapper">
                                <span className="feature-icon">🔍</span>
                            </div>
                            <h3>{t('home.feature_2_title')}</h3>
                            <p>{t('home.feature_2_desc')}</p>
                        </div>
                        <div className="feature-card animate-delay-2">
                            <div className="feature-icon-wrapper">
                                <span className="feature-icon">⚡</span>
                            </div>
                            <h3>{t('home.feature_3_title')}</h3>
                            <p>{t('home.feature_3_desc')}</p>
                        </div>
                        <div className="feature-card animate-delay-3">
                            <div className="feature-icon-wrapper">
                                <span className="feature-icon">💾</span>
                            </div>
                            <h3>{t('home.feature_1_title')}</h3>
                            <p>{t('home.feature_1_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!isAuthenticated && (
                <section className="cta-section">
                    <div className="container">
                        <div className="cta-box glass animate-pulse">
                            <div className="cta-content">
                                <h2>{t('home.cta_title')}</h2>
                                <p>{t('home.cta_desc')}</p>
                                <Link to="/register" className="btn btn-primary btn-lg">
                                    {t('home.start_btn')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default Home;
