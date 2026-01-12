const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(express.static('public'));

// DATABASE
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      price INTEGER,
      description TEXT,
      stock INTEGER,
      rating INTEGER,
      brand TEXT,
      sku TEXT
    )
  `);

  db.run(`
    INSERT INTO products
    (name, category, price, description, stock, rating, brand, sku)
    VALUES
    ('Red Mug','Gifts',199,'Ceramic mug',50,4,'CupCo','MUG-RED')
  `);
});

// VULNERABLE ROUTE (JSON ONLY)
app.get('/products', (req, res) => {
  const category = req.query.category || '';
  const query = `SELECT * FROM products WHERE category = '${category}'`;
  const lower = category.toLowerCase().trim();

  // =============================
  // STRICT INPUT VALIDATION
  // =============================

  // allow ONLY: order by 9
  const isValidOrderBy = lower === "order by 9";

  // allow ONLY: UNION SELECT with exactly 9 NULLs
  const nullCount = (lower.match(/\bnull\b/g) || []).length;
  const isValidUnion =
    lower.includes("union select") && nullCount === 9;

  // ❌ everything else = ERROR
  if (!isValidOrderBy && !isValidUnion) {
    return res.json({
      query,
      error: "SQLITE_ERROR: invalid query structure"
    });
  }

  // =============================
  // EXECUTE QUERY
  // =============================
  db.all(query, (err, rows) => {
    if (err) {
      return res.json({ query, error: err.message });
    }

    // 🎯 FLAG UNLOCK
    const flagUnlocked = isValidOrderBy || isValidUnion;

    // ✅ Inject flag ONLY into column 7 (rating)
    if (flagUnlocked) {
      rows = [
        {
          id: null,
          name: null,
          category: null,
          price: null,
          description: null,
          stock: null,
          rating: 'LNMHACKS{5QL_}', // COLUMN 7
          brand: null,
          sku: null
        }
      ];
    }

    res.json({ query, rows });
  });
});

// SERVER
app.listen(PORT, () => {
  console.log(`CTF running at http://localhost:${PORT}`);
});
