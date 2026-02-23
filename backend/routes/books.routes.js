import express from 'express';
import {
    getAllBooks,
    getBookById,
    downloadBook,
    addToLibrary,
    getUserLibrary,
    addReview,
    getReviews
} from '../controllers/books.controller.js';
import { authenticateToken, authenticateTokenOptional } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/books
 * @desc    Get all books with filters and pagination
 * @access  Public (Identification for admins)
 */
router.get('/', authenticateTokenOptional, getAllBooks);

/**
 * @route   GET /api/books/resources
 * @desc    Get categories and languages for filters
 * @access  Public
 */
router.get('/resources', (req, res, next) => {
    // We need to import it or use it from the default export
    import('../controllers/books.controller.js').then(m => m.default.getPublicResources(req, res)).catch(next);
});

/**
 * @route   GET /api/books/:id
 * @desc    Get book by ID
 * @access  Public
 */
router.get('/:id', getBookById);

/**
 * @route   POST /api/books/:id/download
 * @desc    Download book
 * @access  Private
 */
router.post('/:id/download', authenticateToken, downloadBook);

/**
 * @route   POST /api/books/library
 * @desc    Add book to user library
 * @access  Private
 */
router.post('/library', authenticateToken, addToLibrary);

/**
 * @route   GET /api/books/library/my
 * @desc    Get user's library
 * @access  Private
 */
router.get('/library/my', authenticateToken, getUserLibrary);

/**
 * @route   GET /api/books/:id/reviews
 * @desc    Get reviews for a book
 * @access  Public (Optional Auth for "is_own_review")
 */
router.get('/:id/reviews', authenticateTokenOptional, getReviews);

/**
 * @route   POST /api/books/:id/review
 * @desc    Add review to book
 * @access  Private
 */
router.post('/:id/review', authenticateToken, addReview);

export default router;
