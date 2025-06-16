const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

const PORT = 3000;
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'todolist'
};

async function handleRequest(req, res) {
    try {
        // API Endpoints
        if (req.url === '/api/items' && req.method === 'GET') {
            // Get all items
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute('SELECT * FROM items');
            await connection.end();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        }
        else if (req.url === '/api/items' && req.method === 'POST') {
            // Add new item
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const { text } = JSON.parse(body);
                const connection = await mysql.createConnection(dbConfig);
                const [result] = await connection.execute(
                    'INSERT INTO items (text) VALUES (?)',
                    [text]
                );
                await connection.end();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ id: result.insertId, text }));
            });
        }
        else if (req.url.startsWith('/api/items/') && req.method === 'PUT') {
            // Update item
            const id = req.url.split('/')[3];
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const { text } = JSON.parse(body);
                const connection = await mysql.createConnection(dbConfig);
                await connection.execute(
                    'UPDATE items SET text = ? WHERE id = ?',
                    [text, id]
                );
                await connection.end();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
        }
        else if (req.url.startsWith('/api/items/') && req.method === 'DELETE') {
            // Delete item
            const id = req.url.split('/')[3];
            const connection = await mysql.createConnection(dbConfig);
            await connection.execute('DELETE FROM items WHERE id = ?', [id]);
            await connection.end();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (req.url === '/' && req.method === 'GET') {
            // Serve HTML file
            const html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        }
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));