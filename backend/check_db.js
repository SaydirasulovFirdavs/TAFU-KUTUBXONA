import { query } from './config/database.js';

async function checkBooks() {
    try {
        const res = await query("SELECT id, title, cover_image FROM books WHERE title ILIKE '%Temur%'");
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBooks();
