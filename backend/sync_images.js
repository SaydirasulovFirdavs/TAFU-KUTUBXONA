
import { query } from './config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function syncImages() {
    try {
        console.log('Fetching books from database...');
        const result = await query('SELECT id, title, cover_image FROM books WHERE status = \'active\'');
        const books = result.rows;

        console.log('Found books:');
        console.table(books);

        // Map based on manual observation of uploads folder
        // bb54a5d0-075b-475c-8f6c-d87029c7d097.jpg -> Temur Tuzuklari
        // d0e64e7b-f710-4be8-8310-21dee6a07bcd.jpg -> Kecha va Kunduz
        // d736df53-99a1-4b4b-9a13-929cf98609c7.jpg -> Ikki eshik orasi
        // 617026d7-d478-4d21-887a-0040e0a685fc.png -> Kaktuslar (this was in the API listing)

        const updates = [
            { title: 'Temur Tuzuklari', img: 'uploads/books/bb54a5d0-075b-475c-8f6c-d87029c7d097.jpg' },
            { title: 'Kecha va Kunduz', img: 'uploads/books/d0e64e7b-f710-4be8-8310-21dee6a07bcd.jpg' },
            { title: 'Ikki eshik orasi', img: 'uploads/books/d736df53-99a1-4b4b-9a13-929cf98609c7.jpg' },
            { title: 'Sariq devni minib', img: 'uploads/books/02cbe054-5c5f-4f3c-b5ed-7ed0776b9054.png' }
        ];

        for (const update of updates) {
            const book = books.find(b => b.title.toLowerCase().includes(update.title.toLowerCase()));
            if (book) {
                console.log(`Updating ${book.title} with image ${update.img}...`);
                await query('UPDATE books SET cover_image = $1 WHERE id = $2', [update.img, book.id]);
            } else {
                console.log(`Book not found for title: ${update.title}`);
            }
        }

        console.log('✅ Image sync completed.');

    } catch (err) {
        console.error('❌ Error during sync:', err);
    } finally {
        process.exit(0);
    }
}

syncImages();
