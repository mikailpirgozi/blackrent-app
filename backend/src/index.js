const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Databáza
const db = new sqlite3.Database('./blackrent.db', (err) => {
  if (err) {
    console.error('Chyba pri otváraní databázy:', err);
  } else {
    console.log('Databáza úspešne pripojená');
    initTables();
  }
});

function initTables() {
  // Tabuľka vozidiel
  db.run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      licensePlate TEXT UNIQUE NOT NULL,
      company TEXT NOT NULL,
      pricing TEXT NOT NULL,
      commission TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabuľka prenájmov
  db.run(`
    CREATE TABLE IF NOT EXISTS rentals (
      id TEXT PRIMARY KEY,
      vehicleId TEXT NOT NULL,
      customerId TEXT,
      customerName TEXT NOT NULL,
      startDate DATETIME NOT NULL,
      endDate DATETIME NOT NULL,
      totalPrice REAL NOT NULL,
      commission REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      discount TEXT,
      customCommission TEXT,
      extraKmCharge REAL,
      paid INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      handoverPlace TEXT,
      confirmed INTEGER DEFAULT 0,
      payments TEXT,
      history TEXT,
      orderNumber TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabuľka zákazníkov
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabuľka nákladov
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATETIME NOT NULL,
      vehicleId TEXT,
      company TEXT NOT NULL,
      category TEXT NOT NULL,
      note TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabuľka poistiek
  db.run(`
    CREATE TABLE IF NOT EXISTS insurances (
      id TEXT PRIMARY KEY,
      vehicleId TEXT NOT NULL,
      type TEXT NOT NULL,
      validFrom DATETIME NOT NULL,
      validTo DATETIME NOT NULL,
      price REAL NOT NULL,
      company TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabuľka firiem/autopožičovní
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabuľka poisťovní
  db.run(`
    CREATE TABLE IF NOT EXISTS insurers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Tabuľky inicializované');
}

// API Routes

// GET /api/vehicles - Získať všetky vozidlá
app.get('/api/vehicles', (req, res) => {
  db.all('SELECT * FROM vehicles ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní vozidiel:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní vozidiel'
      });
    } else {
      const vehicles = rows.map(row => ({
        ...row,
        pricing: JSON.parse(row.pricing),
        commission: JSON.parse(row.commission)
      }));
      res.json({
        success: true,
        data: vehicles
      });
    }
  });
});

// POST /api/vehicles - Vytvoriť nové vozidlo
app.post('/api/vehicles', (req, res) => {
  const vehicle = req.body;
  db.run(
    'INSERT INTO vehicles (id, brand, model, licensePlate, company, pricing, commission, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      vehicle.id,
      vehicle.brand,
      vehicle.model,
      vehicle.licensePlate,
      vehicle.company,
      JSON.stringify(vehicle.pricing),
      JSON.stringify(vehicle.commission),
      vehicle.status
    ],
    (err) => {
      if (err) {
        console.error('Chyba pri vytváraní vozidla:', err);
        res.status(500).json({
          success: false,
          error: 'Chyba pri vytváraní vozidla'
        });
      } else {
        res.status(201).json({
          success: true,
          message: 'Vozidlo úspešne vytvorené'
        });
      }
    }
  );
});

// PUT /api/vehicles/:id - Aktualizovať vozidlo
app.put('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  const vehicle = req.body;
  db.run(
    'UPDATE vehicles SET brand = ?, model = ?, licensePlate = ?, company = ?, pricing = ?, commission = ?, status = ? WHERE id = ?',
    [
      vehicle.brand,
      vehicle.model,
      vehicle.licensePlate,
      vehicle.company,
      JSON.stringify(vehicle.pricing),
      JSON.stringify(vehicle.commission),
      vehicle.status,
      id
    ],
    (err) => {
      if (err) {
        console.error('Chyba pri aktualizácii vozidla:', err);
        res.status(500).json({
          success: false,
          error: 'Chyba pri aktualizácii vozidla'
        });
      } else {
        res.json({
          success: true,
          message: 'Vozidlo úspešne aktualizované'
        });
      }
    }
  );
});

// DELETE /api/vehicles/:id - Zmazať vozidlo
app.delete('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM vehicles WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Chyba pri mazaní vozidla:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní vozidla'
      });
    } else {
      res.json({
        success: true,
        message: 'Vozidlo úspešne zmazané'
      });
    }
  });
});

// GET /api/rentals - Získať všetky prenájmy
app.get('/api/rentals', (req, res) => {
  db.all(`
    SELECT r.*, v.brand, v.model, v.licensePlate, v.company 
    FROM rentals r 
    LEFT JOIN vehicles v ON r.vehicleId = v.id 
    ORDER BY r.createdAt DESC
  `, (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní prenájmov:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní prenájmov'
      });
    } else {
      const rentals = rows.map(row => ({
        id: row.id,
        vehicleId: row.vehicleId,
        customerId: row.customerId,
        customerName: row.customerName,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        totalPrice: row.totalPrice,
        commission: row.commission,
        paymentMethod: row.paymentMethod,
        createdAt: new Date(row.createdAt),
        vehicle: {
          id: row.vehicleId,
          brand: row.brand,
          model: row.model,
          licensePlate: row.licensePlate,
          company: row.company,
          pricing: [],
          commission: { type: 'percentage', value: 20 },
          status: 'available'
        },
        discount: row.discount ? JSON.parse(row.discount) : undefined,
        customCommission: row.customCommission ? JSON.parse(row.customCommission) : undefined,
        extraKmCharge: row.extraKmCharge,
        paid: Boolean(row.paid),
        status: row.status,
        handoverPlace: row.handoverPlace,
        confirmed: Boolean(row.confirmed),
        payments: row.payments ? JSON.parse(row.payments) : undefined,
        history: row.history ? JSON.parse(row.history) : undefined,
        orderNumber: row.orderNumber
      }));
      res.json({
        success: true,
        data: rentals
      });
    }
  });
});

// POST /api/rentals - Vytvoriť nový prenájom
app.post('/api/rentals', (req, res) => {
  const rental = req.body;
  db.run(
    `INSERT INTO rentals (
      id, vehicleId, customerId, customerName, startDate, endDate, 
      totalPrice, commission, paymentMethod, discount, customCommission, 
      extraKmCharge, paid, status, handoverPlace, confirmed, payments, history, orderNumber
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rental.id,
      rental.vehicleId,
      rental.customerId,
      rental.customerName,
      rental.startDate,
      rental.endDate,
      rental.totalPrice,
      rental.commission,
      rental.paymentMethod,
      rental.discount ? JSON.stringify(rental.discount) : null,
      rental.customCommission ? JSON.stringify(rental.customCommission) : null,
      rental.extraKmCharge,
      rental.paid ? 1 : 0,
      rental.status,
      rental.handoverPlace,
      rental.confirmed ? 1 : 0,
      rental.payments ? JSON.stringify(rental.payments) : null,
      rental.history ? JSON.stringify(rental.history) : null,
      rental.orderNumber
    ],
    (err) => {
      if (err) {
        console.error('Chyba pri vytváraní prenájmu:', err);
        res.status(500).json({
          success: false,
          error: 'Chyba pri vytváraní prenájmu'
        });
      } else {
        res.status(201).json({
          success: true,
          message: 'Prenájom úspešne vytvorený'
        });
      }
    }
  );
});

// PUT /api/rentals/:id - Aktualizovať prenájom
app.put('/api/rentals/:id', (req, res) => {
  const { id } = req.params;
  const rental = req.body;
  db.run(
    `UPDATE rentals SET 
      vehicleId = ?, customerId = ?, customerName = ?, startDate = ?, endDate = ?,
      totalPrice = ?, commission = ?, paymentMethod = ?, discount = ?, customCommission = ?,
      extraKmCharge = ?, paid = ?, status = ?, handoverPlace = ?, confirmed = ?, 
      payments = ?, history = ?, orderNumber = ?
    WHERE id = ?`,
    [
      rental.vehicleId,
      rental.customerId,
      rental.customerName,
      rental.startDate,
      rental.endDate,
      rental.totalPrice,
      rental.commission,
      rental.paymentMethod,
      rental.discount ? JSON.stringify(rental.discount) : null,
      rental.customCommission ? JSON.stringify(rental.customCommission) : null,
      rental.extraKmCharge,
      rental.paid ? 1 : 0,
      rental.status,
      rental.handoverPlace,
      rental.confirmed ? 1 : 0,
      rental.payments ? JSON.stringify(rental.payments) : null,
      rental.history ? JSON.stringify(rental.history) : null,
      rental.orderNumber,
      id
    ],
    (err) => {
      if (err) {
        console.error('Chyba pri aktualizácii prenájmu:', err);
        res.status(500).json({
          success: false,
          error: 'Chyba pri aktualizácii prenájmu'
        });
      } else {
        res.json({
          success: true,
          message: 'Prenájom úspešne aktualizovaný'
        });
      }
    }
  );
});

// DELETE /api/rentals/:id - Zmazať prenájom
app.delete('/api/rentals/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM rentals WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Chyba pri mazaní prenájmu:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní prenájmu'
      });
    } else {
      res.json({
        success: true,
        message: 'Prenájom úspešne zmazaný'
      });
    }
  });
});

// GET /api/customers - Získať všetkých zákazníkov
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní zákazníkov:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní zákazníkov'
      });
    } else {
      const customers = rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt)
      }));
      res.json({
        success: true,
        data: customers
      });
    }
  });
});

// POST /api/customers - Vytvoriť nového zákazníka
app.post('/api/customers', (req, res) => {
  const customer = req.body;
  db.run(
    'INSERT INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)',
    [customer.id, customer.name, customer.email, customer.phone],
    (err) => {
      if (err) {
        console.error('Chyba pri vytváraní zákazníka:', err);
        res.status(500).json({
          success: false,
          error: 'Chyba pri vytváraní zákazníka'
        });
      } else {
        res.status(201).json({
          success: true,
          message: 'Zákazník úspešne vytvorený'
        });
      }
    }
  );
});

// PUT /api/customers/:id - Aktualizovať zákazníka
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const customer = req.body;
  db.run(
    'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?',
    [customer.name, customer.email, customer.phone, id],
    (err) => {
      if (err) {
        console.error('Chyba pri aktualizácii zákazníka:', err);
        res.status(500).json({
          success: false,
          error: 'Chyba pri aktualizácii zákazníka'
        });
      } else {
        res.json({
          success: true,
          message: 'Zákazník úspešne aktualizovaný'
        });
      }
    }
  );
});

// GET /api/expenses - Získať všetky náklady
app.get('/api/expenses', (req, res) => {
  db.all('SELECT * FROM expenses ORDER BY date DESC', (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní nákladov:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní nákladov'
      });
    } else {
      const expenses = rows.map(row => ({
        ...row,
        date: new Date(row.date),
        createdAt: new Date(row.createdAt)
      }));
      res.json({
        success: true,
        data: expenses
      });
    }
  });
});

// POST /api/expenses - Vytvoriť nový náklad
app.post('/api/expenses', (req, res) => {
  const expense = req.body;
  db.run(
    'INSERT INTO expenses (id, description, amount, date, vehicleId, company, category, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      expense.id,
      expense.description,
      expense.amount,
      expense.date,
      expense.vehicleId,
      expense.company,
      expense.category,
      expense.note
    ],
    (err) => {
      if (err) {
        console.error('Chyba pri vytváraní nákladu:', err);
        res.status(500).json({
          success: false,
          error: 'Chyba pri vytváraní nákladu'
        });
      } else {
        res.status(201).json({
          success: true,
          message: 'Náklad úspešne vytvorený'
        });
      }
    }
  );
});

// GET /api/insurances - Získať všetky poistky
app.get('/api/insurances', (req, res) => {
  db.all('SELECT * FROM insurances ORDER BY validFrom DESC', (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní poistiek:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní poistiek'
      });
    } else {
      const insurances = rows.map(row => ({
        ...row,
        validFrom: new Date(row.validFrom),
        validTo: new Date(row.validTo),
        createdAt: new Date(row.createdAt)
      }));
      res.json({
        success: true,
        data: insurances
      });
    }
  });
});

// POST /api/insurances - Vytvoriť novú poistku
app.post('/api/insurances', (req, res) => {
  const insurance = req.body;
  db.run(
    'INSERT INTO insurances (id, vehicleId, type, validFrom, validTo, price, company) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      insurance.id,
      insurance.vehicleId,
      insurance.type,
      insurance.validFrom,
      insurance.validTo,
      insurance.price,
      insurance.company
    ],
    (err) => {
      if (err) {
        console.error('Chyba pri vytváraní poistky:', err);
        res.status(500).json({
          success: false,
          error: 'Chyba pri vytváraní poistky'
        });
      } else {
        res.status(201).json({
          success: true,
          message: 'Poistka úspešne vytvorená'
        });
      }
    }
  );
});

// =============================================================================
// COMPANIES API (Firmy/Autopožičovne)
// =============================================================================

// GET /api/companies - Získať všetky firmy
app.get('/api/companies', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log(`${currentTime} - GET /api/companies`);
  
  db.all('SELECT * FROM companies ORDER BY name ASC', (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní firiem:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní firiem'
      });
    } else {
      res.json({
        success: true,
        data: rows
      });
    }
  });
});

// POST /api/companies - Vytvoriť novú firmu
app.post('/api/companies', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log(`${currentTime} - POST /api/companies`);
  
  const { id, name } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({
      success: false,
      error: 'ID a názov firmy sú povinné'
    });
  }
  
  db.run(
    'INSERT INTO companies (id, name) VALUES (?, ?)',
    [id, name],
    function(err) {
      if (err) {
        console.error('Chyba pri vytváraní firmy:', err);
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          res.status(409).json({
            success: false,
            error: 'Firma s týmto názvom už existuje'
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní firmy'
          });
        }
      } else {
        res.status(201).json({
          success: true,
          message: 'Firma úspešne vytvorená'
        });
      }
    }
  );
});

// DELETE /api/companies/:id - Vymazať firmu
app.delete('/api/companies/:id', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log(`${currentTime} - DELETE /api/companies/${req.params.id}`);
  
  const { id } = req.params;
  
  db.run('DELETE FROM companies WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Chyba pri mazaní firmy:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní firmy'
      });
    } else if (this.changes === 0) {
      res.status(404).json({
        success: false,
        error: 'Firma nebola nájdená'
      });
    } else {
      res.json({
        success: true,
        message: 'Firma úspešne vymazaná'
      });
    }
  });
});

// =============================================================================
// INSURERS API (Poisťovne)
// =============================================================================

// GET /api/insurers - Získať všetky poisťovne
app.get('/api/insurers', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log(`${currentTime} - GET /api/insurers`);
  
  db.all('SELECT * FROM insurers ORDER BY name ASC', (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní poisťovní:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní poisťovní'
      });
    } else {
      res.json({
        success: true,
        data: rows
      });
    }
  });
});

// POST /api/insurers - Vytvoriť novú poisťovňu
app.post('/api/insurers', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log(`${currentTime} - POST /api/insurers`);
  
  const { id, name } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({
      success: false,
      error: 'ID a názov poisťovne sú povinné'
    });
  }
  
  db.run(
    'INSERT INTO insurers (id, name) VALUES (?, ?)',
    [id, name],
    function(err) {
      if (err) {
        console.error('Chyba pri vytváraní poisťovne:', err);
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          res.status(409).json({
            success: false,
            error: 'Poisťovňa s týmto názvom už existuje'
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní poisťovne'
          });
        }
      } else {
        res.status(201).json({
          success: true,
          message: 'Poisťovňa úspešne vytvorená'
        });
      }
    }
  );
});

// DELETE /api/insurers/:id - Vymazať poisťovňu
app.delete('/api/insurers/:id', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log(`${currentTime} - DELETE /api/insurers/${req.params.id}`);
  
  const { id } = req.params;
  
  db.run('DELETE FROM insurers WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Chyba pri mazaní poisťovne:', err);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní poisťovne'
      });
    } else if (this.changes === 0) {
      res.status(404).json({
        success: false,
        error: 'Poisťovňa nebola nájdená'
      });
    } else {
      res.json({
        success: true,
        message: 'Poisťovňa úspešne vymazaná'
      });
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blackrent API je funkčné',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Chyba servera:', err);
  res.status(500).json({
    success: false,
    error: 'Interná chyba servera'
  });
});

// Catch-all handler: send back React's index.html file for non-API routes
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  } else {
    res.status(404).json({
      success: false,
      error: 'Endpoint nebol nájdený'
    });
  }
});

// Spustenie servera
app.listen(PORT, () => {
  console.log(`🚀 Blackrent API server beží na porte ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🚗 Vozidlá API: http://localhost:${PORT}/api/vehicles`);
  console.log(`📋 Prenájmy API: http://localhost:${PORT}/api/rentals`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Zastavujem server...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Zastavujem server...');
  db.close();
  process.exit(0);
}); console.log('🔄 Force rebuild Tue Jul 15 23:23:06 CEST 2025');
