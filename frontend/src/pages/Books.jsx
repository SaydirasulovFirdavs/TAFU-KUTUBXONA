import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { booksAPI, API_URL } from '../services/api';
import BookCard from '../components/BookCard';
import Skeleton from '../components/ui/Skeleton';
import './Books.css';

function Books() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        language: ''
    });
    const [resources, setResources] = useState({
        categories: [],
        languages: []
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 12
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlSearch = params.get('search');
        if (urlSearch !== null) {
            setSearch(urlSearch);
        }

        const urlCategory = params.get('category');
        const urlLanguage = params.get('language');
        if (urlCategory || urlLanguage) {
            setFilters(prev => ({
                ...prev,
                category: urlCategory || '',
                language: urlLanguage || ''
            }));
        }

        fetchResources();
    }, [location.search]);

    useEffect(() => {
        fetchBooks();
    }, [pagination.currentPage, search, filters.category, filters.language]);

    const fetchResources = async () => {
        try {
            const response = await booksAPI.getPublicResources();
            if (response.data?.success) {
                setResources(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch resources:', err);
        }
    };

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await booksAPI.getAll({
                page: pagination.currentPage,
                limit: 12,
                search: search || undefined,
                category: filters.category || undefined,
                language: filters.language || undefined
            });

            setBooks(response.data.data.books);
            setPagination(response.data.data.pagination);
            setError('');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || err.message || t('common.error');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchBooks();
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        const baseUrl = API_URL.endsWith('/api') ? API_URL.replace('/api', '') : API_URL;

        const cleanPath = path.replace(/\\/g, '/');
        const finalUrl = `${baseUrl}/${cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath}`;

        return finalUrl;
    };

    const getLanguageName = (lang) => {
        return t(`languages.${lang.code}`, { defaultValue: lang.name });
    };

    const getCategoryName = (category) => {
        if (!category) return '';
        const currentLang = i18n.language || 'uz';
        if (currentLang === 'ru') return category.name_ru || category.name_uz;
        if (currentLang === 'en') return category.name_en || category.name_uz;
        return category.name_uz;
    };

    if (loading && books.length === 0) {
        return (
            <div className="books-page">
                <div className="container">
                    <div className="books-header">
                        <Skeleton type="title" width="200px" height="32px" />
                        <div className="search-filters">
                            <Skeleton width="100%" height="50px" />
                        </div>
                    </div>
                    <div className="books-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="book-card-skeleton">
                                <Skeleton type="image" height="300px" />
                                <Skeleton type="title" width="80%" />
                                <Skeleton type="text" width="60%" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="books-page">
            <div className="container">
                <div className="back-link-wrapper">
                    <button onClick={() => navigate('/')} className="back-btn">
                        <span>←</span> {t('books_page.back_btn')}
                    </button>
                </div>
                {/* Header */}
                <h1 className="books-title animate-fade-in-up">
                    <span className="library-icon">📚</span> {t('books_page.title')}
                </h1>
                <p className="books-subtitle">
                    {t('books_page.subtitle_other', { count: pagination.totalBooks })}
                </p>

                {/* Filters & Search */}
                <div className="books-controls animate-fade-in">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder={t('books_page.search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary">
                                🔍 {t('books_page.search_btn')}
                            </button>
                        </div>
                    </form>

                    <div className="filters-wrapper">
                        <div className="filter-group">
                            <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="form-input"
                            >
                                <option value="">{t('books_page.all_categories', { defaultValue: 'Barcha kategoriyalar' })}</option>
                                {resources.categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {getCategoryName(cat)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <select
                                name="language"
                                value={filters.language}
                                onChange={handleFilterChange}
                                className="form-input"
                            >
                                <option value="">{t('books_page.all_languages', { defaultValue: 'Barcha tillar' })}</option>
                                {resources.languages.map(lang => (
                                    <option key={lang.id} value={lang.id}>
                                        {getLanguageName(lang)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Books Grid */}
                {books.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>{t('books_page.no_books_title')}</h3>
                        <p>{t('books_page.no_books_desc')}</p>
                    </div>
                ) : (
                    <>
                        <div className="books-grid">
                            {books.map((book, index) => (
                                <Link
                                    key={book.id}
                                    to={`/books/${book.id}`}
                                    className="book-card card animate-fade-in"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="book-cover">
                                        {book.cover_image ? (
                                            <img
                                                src={getImageUrl(book.cover_image)}
                                                alt={book.title}
                                                onError={(e) => {
                                                    e.target.onerror = null; // Prevent infinite loop
                                                    e.target.src = 'https://via.placeholder.com/300x400?text=No+Cover';
                                                }}
                                            />
                                        ) : (
                                            <div className="book-cover-placeholder">
                                                <span>📖</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="book-info">
                                        <h3 className="book-title">{book.title}</h3>
                                        <p className="book-author">
                                            {book.author_name || t('books_page.unknown_author')}
                                        </p>
                                        <div className="book-meta">
                                            <span className="book-language">
                                                🌐 {book.language_name}
                                            </span>
                                            {book.rating_avg > 0 && (
                                                <span className="book-rating">
                                                    ⭐ {Number(book.rating_avg).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="book-stats">
                                            <span>👁️ {book.view_count}</span>
                                            <span>💾 {book.download_count}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                >
                                    ← {t('books_page.prev_page')}
                                </button>
                                <span className="pagination-info">
                                    {t('books_page.page_info', { current: pagination.currentPage, total: pagination.totalPages })}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                >
                                    {t('books_page.next_page')} →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Books;
