import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { booksAPI } from '../services/api';
import './BookReader.css';

// Set worker 
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

function BookReader() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.5);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState('thumbnails'); // 'thumbnails' or 'list'
    const contentRef = useRef(null);
    const sidebarRef = useRef(null);

    useEffect(() => {
        fetchBook();
    }, [id]);

    // Scroll active page into view in sidebar
    useEffect(() => {
        if (sidebarRef.current && sidebarOpen) {
            const activeItem = sidebarRef.current.querySelector('.page-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [pageNumber, sidebarOpen]);

    const fetchBook = async () => {
        try {
            setLoading(true);
            const response = await booksAPI.getById(id);
            setBook(response.data.data);
        } catch (err) {
            setError('Kitobni yuklashda xatolik yuz berdi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    const goToPage = (page) => {
        setPageNumber(page);
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    };

    const previousPage = () => {
        if (pageNumber > 1) goToPage(pageNumber - 1);
    };

    const nextPage = () => {
        if (pageNumber < numPages) goToPage(pageNumber + 1);
    };

    const zoomIn = () => setScale(scale => Math.min(scale + 0.2, 3.0));
    const zoomOut = () => setScale(scale => Math.max(scale - 0.2, 0.5));
    const resetZoom = () => setScale(1.5);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                previousPage();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextPage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageNumber, numPages]);

    if (loading) {
        return (
            <div className="reader-loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">Kitob yuklanmoqda...</div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="reader-error">
                <div className="error-icon">📚</div>
                <h2>Xatolik</h2>
                <p>{error || 'Kitob topilmadi'}</p>
                <button className="btn-back" onClick={() => navigate('/books')}>
                    Ortga qaytish
                </button>
            </div>
        );
    }

    const pdfUrl = book.file_url || (book.file_path ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${book.file_path}` : null);
    const pages = Array.from({ length: numPages || 0 }, (_, i) => i + 1);

    return (
        <div className="book-reader-pro">
            {/* Left Sidebar - Page Navigator */}
            <aside className={`reader-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <h3>Sahifalar</h3>
                    <div className="sidebar-controls">
                        {/* View mode toggle */}
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'thumbnails' ? 'active' : ''}`}
                                onClick={() => setViewMode('thumbnails')}
                                title="Thumbnail ko'rinish"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                </svg>
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="Ro'yxat ko'rinish"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <button
                            className="sidebar-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            ◀
                        </button>
                    </div>
                </div>

                {sidebarOpen && (
                    <div className={`page-list ${viewMode}`} ref={sidebarRef}>
                        {viewMode === 'thumbnails' ? (
                            // Thumbnail view with mini page previews
                            <Document file={pdfUrl} loading="">
                                {pages.map(page => (
                                    <div
                                        key={page}
                                        className={`page-thumbnail-item ${page === pageNumber ? 'active' : ''}`}
                                        onClick={() => goToPage(page)}
                                    >
                                        <div className="thumbnail-wrapper">
                                            <Page
                                                pageNumber={page}
                                                width={140}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                loading={
                                                    <div className="thumbnail-placeholder">
                                                        <span>{page}</span>
                                                    </div>
                                                }
                                            />
                                        </div>
                                        <span className="thumbnail-number">{page}</span>
                                    </div>
                                ))}
                            </Document>
                        ) : (
                            // List view
                            pages.map(page => (
                                <button
                                    key={page}
                                    className={`page-item ${page === pageNumber ? 'active' : ''}`}
                                    onClick={() => goToPage(page)}
                                >
                                    <span className="page-number">{page}</span>
                                    <span className="page-label">-sahifa</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className="reader-main">
                {/* Header Controls */}
                <header className="reader-header-pro">
                    <div className="header-left">
                        <button
                            onClick={() => navigate(`/books/${id}`)}
                            className="btn-back-pro"
                            title="Ortga qaytish"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <div className="book-title-pro">
                            <span className="title-text">{book.title}</span>
                            {book.author_name && (
                                <span className="author-text">{book.author_name}</span>
                            )}
                        </div>
                    </div>

                    <div className="header-center">
                        <div className="nav-group">
                            <button
                                disabled={pageNumber <= 1}
                                onClick={previousPage}
                                className="nav-btn"
                                title="Oldingi sahifa (←)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>

                            <div className="page-indicator">
                                <input
                                    type="number"
                                    value={pageNumber}
                                    min={1}
                                    max={numPages || 1}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val >= 1 && val <= numPages) {
                                            goToPage(val);
                                        }
                                    }}
                                    className="page-input"
                                />
                                <span className="page-divider">/</span>
                                <span className="total-pages">{numPages || '--'}</span>
                            </div>

                            <button
                                disabled={pageNumber >= numPages}
                                onClick={nextPage}
                                className="nav-btn"
                                title="Keyingi sahifa (→)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="zoom-group">
                            <button onClick={zoomOut} className="zoom-btn" title="Kichiklashtirish">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                            </button>
                            <button onClick={resetZoom} className="zoom-percent" title="Asl o'lchamga qaytarish">
                                {Math.round(scale * 100)}%
                            </button>
                            <button onClick={zoomIn} className="zoom-btn" title="Kattalashtirish">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="11" y1="8" x2="11" y2="14"></line>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                            </button>
                        </div>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="toggle-sidebar-btn"
                            title={sidebarOpen ? "Sidebar yopish" : "Sidebar ochish"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="3" x2="9" y2="21"></line>
                            </svg>
                        </button>
                    </div>
                </header>

                {/* PDF Content */}
                <div className="reader-content-pro" ref={contentRef}>
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="pdf-loading">
                                <div className="loading-spinner"></div>
                                <span>PDF yuklanmoqda...</span>
                            </div>
                        }
                        error={
                            <div className="pdf-error">
                                <div className="error-icon">⚠️</div>
                                <p>PDF faylni yuklashda xatolik.</p>
                                <p>Fayl shikastlangan yoki mavjud emas.</p>
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="pdf-page"
                        />
                    </Document>
                </div>

                {/* Bottom Progress Bar */}
                <div className="reader-progress">
                    <div
                        className="progress-bar"
                        style={{ width: `${(pageNumber / (numPages || 1)) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default BookReader;
