const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Database (in-memory)
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    price INTEGER,
    description TEXT,
    stock INTEGER,
    rating INTEGER,
    brand TEXT,
    sku TEXT
  )`);

  db.run(`
    INSERT INTO products (name, category, price, description, stock, rating, brand, sku)
    VALUES ('Red Mug','Gifts',199,'Ceramic mug',50,4,'CupCo','MUG-RED')
  `);
});

// Detect 9-column UNION
function detectNineNullUnion(input) {
  if (!input) return false;
  const lower = input.toLowerCase();
  if (!lower.includes('union select')) return false;
  const cols = lower.split(',').length;
  return cols === 9;
}
function detectOrderByNine(input) {
  if (!input) return false;
  const lower = input.toLowerCase();

  // matches: order by 9, order by 9--
  return lower.includes('order by 9');
}


app.get('/', (req, res) => {
  res.send(`
    <h2>SQLi UNION CTF</h2>
    <form action="/products">
      <input name="category" placeholder="Gifts">
      <button>Search</button>
    </form>
  `);
});

app.get('/products', (req, res) => {
  const category = req.query.category || '';

  // ❌ Intentionally vulnerable query
  const query = `SELECT * FROM products WHERE category = '${category}'`;

  db.all(query, (err, rows) => {
    let html = `<pre>${query}</pre>`;

    if (err) {
      html += `<p style="color:red">${err.message}</p>`;
    } else {
      html += '<table border="1"><tr>';
      Object.keys(rows[0] || {}).forEach(c => html += `<th>${c}</th>`);
      html += '</tr>';

      rows.forEach(r => {
        html += '<tr>';
        Object.values(r).forEach(v => html += `<td>${v}</td>`);
        html += '</tr>';
      });
      html += '</table>';
    }

    if (detectNineNullUnion(category) || detectOrderByNine(category)) {
  html += `
    <h2 style="color:green">🎉 FLAG UNLOCKED</h2>
    <p><b>LNMHACKS{5QL_}</b></p>
  `;
}


    res.send(html);
  });
});

app.listen(PORT, () =>
  console.log(`CTF running at http://localhost:${PORT}`)
);
