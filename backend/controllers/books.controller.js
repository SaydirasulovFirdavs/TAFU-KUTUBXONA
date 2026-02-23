import { query, getClient } from '../config/database.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all books with pagination and filters
 */
export const getAllBooks = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            language,
            author,
            search,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        // Security: Validate sortBy and sortOrder to prevent SQL Injection
        const allowedSortBy = ['created_at', 'title', 'view_count', 'download_count', 'rating_avg', 'publish_year', 'pages'];
        const allowedSortOrder = ['ASC', 'DESC'];

        const finalSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const offset = (page - 1) * limit;

        // Admin visibility: Admins can see all books, others see only active
        let whereClause = "WHERE (b.status = 'active')";
        if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
            const { status } = req.query;
            if (status === 'all') {
                whereClause = "WHERE (b.status != 'deleted')";
            } else if (status) {
                whereClause = `WHERE (b.status = '${status}')`;
            } else {
                whereClause = "WHERE (b.status != 'deleted')";
            }
        }

        const params = [];
        let paramIndex = 1;

        // Search filter
        if (search) {
            whereClause += ` AND (b.title ILIKE $${paramIndex} OR a.name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Category filter
        if (category) {
            whereClause += ` AND EXISTS (
                SELECT 1 FROM book_categories bc 
                WHERE bc.book_id = b.id AND bc.category_id = $${paramIndex}
            )`;
            params.push(category);
            paramIndex++;
        }

        // Language filter
        if (language) {
            whereClause += ` AND b.language_id = $${paramIndex}`;
            params.push(language);
            paramIndex++;
        }

        // Author filter
        if (author) {
            whereClause += ` AND b.author_id = $${paramIndex}`;
            params.push(author);
            paramIndex++;
        }

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) FROM books b 
             LEFT JOIN authors a ON b.author_id = a.id 
             ${whereClause}`,
            params
        );
        const totalBooks = parseInt(countResult.rows[0].count);

        // Get books
        const result = await query(
            `SELECT 
                b.id, b.title, b.description, b.isbn, b.publisher, 
                b.publish_year, b.pages, b.file_format, b.cover_image, b.file_path,
                b.download_count, b.view_count, b.rating_avg, b.rating_count,
                b.created_at, b.status,
                b.author_id, b.language_id,
                a.name as author_name,
                l.name as language_name,
                l.code as language_code,
                COALESCE(
                    (SELECT json_agg(bc.category_id) 
                     FROM book_categories bc 
                     WHERE bc.book_id = b.id),
                    '[]'
                ) as category_ids
             FROM books b
             LEFT JOIN authors a ON b.author_id = a.id
             LEFT JOIN languages l ON b.language_id = l.id
             ${whereClause}
             ORDER BY b.${finalSortBy} ${finalSortOrder}
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: {
                books: result.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalBooks / limit),
                    totalBooks,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({
            success: false,
            message: 'Kitoblarni olishda xatolik yuz berdi'
        });
    }
};

/**
 * Get book by ID
 */
export const getBookById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT 
                b.*,
                a.name as author_name, a.bio as author_bio,
                l.name as language_name, l.code as language_code,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', c.id,
                            'name_uz', c.name_uz,
                            'name_ru', c.name_ru,
                            'name_en', c.name_en,
                            'slug', c.slug
                        )
                    ) FILTER (WHERE c.id IS NOT NULL),
                    '[]'
                ) as categories
             FROM books b
             LEFT JOIN authors a ON b.author_id = a.id
             LEFT JOIN languages l ON b.language_id = l.id
             LEFT JOIN book_categories bc ON b.id = bc.book_id
             LEFT JOIN categories c ON bc.category_id = c.id
             WHERE b.id = $1 AND b.status = 'active'
             GROUP BY b.id, a.name, a.bio, l.name, l.code`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        // Increment view count
        await query(
            'UPDATE books SET view_count = view_count + 1 WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({
            success: false,
            message: 'Kitobni olishda xatolik yuz berdi'
        });
    }
};

/**
 * Download book
 */
export const downloadBook = async (req, res) => {
    const client = await getClient();

    try {
        const { id } = req.params;
        const userId = req.user.id;

        await client.query('BEGIN');

        // Get book info
        const bookResult = await client.query(
            'SELECT title, file_path, file_format FROM books WHERE id = $1 AND status = $2',
            [id, 'active']
        );

        if (bookResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        const book = bookResult.rows[0];

        // Log download
        await client.query(
            `INSERT INTO download_history (user_id, book_id, ip_address)
             VALUES ($1, $2, $3)`,
            [userId, id, req.ip]
        );

        // Increment download count
        await client.query(
            'UPDATE books SET download_count = download_count + 1 WHERE id = $1',
            [id]
        );

        // Log analytics event
        await client.query(
            `INSERT INTO analytics_events (event_type, user_id, book_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)`,
            ['download', userId, id, req.ip, req.get('user-agent')]
        );

        await client.query('COMMIT');

        // Send file
        const filePath = path.join(process.cwd(), book.file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Fayl topilmadi'
            });
        }

        const fileName = `${book.title}.${book.file_format}`;
        res.download(filePath, fileName);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: 'Yuklab olishda xatolik yuz berdi'
        });
    } finally {
        client.release();
    }
};

/**
 * Add book to user library
 */
export const addToLibrary = async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user.id;

        // Check if book exists
        const bookExists = await query(
            'SELECT id FROM books WHERE id = $1 AND status = $2',
            [bookId, 'active']
        );

        if (bookExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        // Add to library (ignore if already exists)
        await query(
            `INSERT INTO user_library (user_id, book_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, book_id) DO NOTHING`,
            [userId, bookId]
        );

        res.json({
            success: true,
            message: 'Kitob kutubxonaga qo\'shildi'
        });

    } catch (error) {
        console.error('Add to library error:', error);
        res.status(500).json({
            success: false,
            message: 'Kutubxonaga qo\'shishda xatolik yuz berdi'
        });
    }
};

/**
 * Get user library
 */
export const getUserLibrary = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT 
                b.id, b.title, b.description, b.cover_image,
                b.rating_avg, b.rating_count,
                a.name as author_name,
                l.name as language_name,
                ul.added_at
             FROM user_library ul
             JOIN books b ON ul.book_id = b.id
             LEFT JOIN authors a ON b.author_id = a.id
             LEFT JOIN languages l ON b.language_id = l.id
             WHERE ul.user_id = $1 AND b.status = 'active'
             ORDER BY ul.added_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get library error:', error);
        res.status(500).json({
            success: false,
            message: 'Kutubxonani olishda xatolik yuz berdi'
        });
    }
};

/**
 * Add review
 */
/**
 * Get reviews for a book
 */
export const getReviews = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT 
                r.id, r.rating, r.comment, r.created_at,
                u.full_name as user_name,
                r.user_id = $2 as is_own_review
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.book_id = $1 AND r.status = 'active'
             ORDER BY r.created_at DESC`,
            [id, req.user?.id || null]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Sharhlarni olishda xatolik yuz berdi'
        });
    }
};

export const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Baho 1 dan 5 gacha bo\'lishi kerak'
            });
        }

        // Add or update review
        await query(
            `INSERT INTO reviews (user_id, book_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, book_id) 
             DO UPDATE SET rating = $3, comment = $4, updated_at = CURRENT_TIMESTAMP`,
            [userId, id, rating, comment]
        );

        res.json({
            success: true,
            message: 'Sharh qo\'shildi'
        });

    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Sharh qo\'shishda xatolik yuz berdi'
        });
    }
};

export default {
    getAllBooks,
    getBookById,
    downloadBook,
    addToLibrary,
    getUserLibrary,
    addReview,
    getReviews,
    getPublicResources: async (req, res) => {
        try {
            const languages = await query('SELECT id, name, code FROM languages ORDER BY name');
            const categories = await query('SELECT id, name_uz, name_ru, name_en, slug FROM categories ORDER BY name_uz');

            res.json({
                success: true,
                data: {
                    languages: languages.rows,
                    categories: categories.rows
                }
            });
        } catch (error) {
            console.error('Get public resources error:', error);
            res.status(500).json({
                success: false,
                message: 'Resurslarni olishda xatolik yuz berdi'
            });
        }
    }
};
