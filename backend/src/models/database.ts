import sqlite3 from 'sqlite3';
import { Vehicle, Customer, Rental, Expense, Insurance, User, Company, Insurer } from '../types';
import fs from 'fs';
import path from 'path';

export class Database {
  private db: sqlite3.Database;
  private backupDir: string;

  constructor() {
    // Vytvorenie priečinka backups
    this.backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    this.db = new sqlite3.Database('./blackrent.db', (err) => {
      if (err) {
        console.error('Chyba pri otváraní databázy:', err);
      } else {
        console.log('Databáza úspešne pripojená');
        this.initTables();
        this.startDailyBackup();
      }
    });
  }

  // Spustenie denného zálohovania
  private startDailyBackup(): void {
    // Záloha každých 24 hodín
    setInterval(() => {
      this.createAutoBackup('daily').catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 hodín v milisekundách
    
    console.log('🕐 Denné automatické zálohovanie aktivované');
  }

  // Automatická záloha pred každou kritickou operáciou
  private async createAutoBackup(operation: string = 'auto'): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `blackrent-${operation}-${timestamp}.db`);
      
      if (fs.existsSync('./blackrent.db')) {
        fs.copyFileSync('./blackrent.db', backupPath);
        console.log(`🔄 Automatická záloha pred ${operation}: ${backupPath}`);
        
        // Ponechať len posledných 10 záloh
        this.cleanupOldBackups();
      }
    } catch (error) {
      console.error('Chyba pri automatickej zálohe:', error);
    }
  }

  private cleanupOldBackups(): void {
    try {
      const backupFiles = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('blackrent-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Ponechať len 20 najnovších záloh
      if (backupFiles.length > 20) {
        backupFiles.slice(20).forEach(backup => {
          fs.unlinkSync(backup.path);
          console.log(`🗑️ Vymazaná stará záloha: ${backup.name}`);
        });
      }
    } catch (error) {
      console.error('Chyba pri čistení starých záloh:', error);
    }
  }

  private initTables() {
    // Vytvorenie zálohy pri spustení
    this.createAutoBackup('startup').catch(console.error);
    
    // Tabuľka používateľov
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        createdAt TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Chyba pri vytváraní tabuľky users:', err);
      } else {
        console.log('Tabuľka users pripravená');
      }
    });

    // Tabuľka vozidiel
    this.db.run(`
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

    // Tabuľka zákazníkov
    this.db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabuľka prenájmov
    this.db.run(`
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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id),
        FOREIGN KEY (customerId) REFERENCES customers (id)
      )
    `);

    // Tabuľka nákladov
    this.db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        vehicleId TEXT,
        company TEXT NOT NULL,
        category TEXT NOT NULL,
        note TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id)
      )
    `);

    // Tabuľka poistiek
    this.db.run(`
      CREATE TABLE IF NOT EXISTS insurances (
        id TEXT PRIMARY KEY,
        vehicleId TEXT NOT NULL,
        type TEXT NOT NULL,
        validFrom DATETIME NOT NULL,
        validTo DATETIME NOT NULL,
        price REAL NOT NULL,
        company TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id)
      )
    `);

    // Tabuľka firiem
    this.db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabuľka poisťovní
    this.db.run(`
      CREATE TABLE IF NOT EXISTS insurers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tabuľky inicializované');
  }



  // Metódy pre vozidlá
  async getVehicles(): Promise<Vehicle[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM vehicles ORDER BY createdAt DESC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const vehicles = rows.map(row => ({
            ...row,
            pricing: row.pricing ? JSON.parse(row.pricing) : null,
            commission: row.commission ? JSON.parse(row.commission) : null
          }));
          resolve(vehicles);
        }
      });
    });
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM vehicles WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            pricing: row.pricing ? JSON.parse(row.pricing) : null,
            commission: row.commission ? JSON.parse(row.commission) : null
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async createVehicle(vehicle: Vehicle): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
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
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE vehicles SET brand = ?, model = ?, licensePlate = ?, company = ?, pricing = ?, commission = ?, status = ? WHERE id = ?',
        [
          vehicle.brand,
          vehicle.model,
          vehicle.licensePlate,
          vehicle.company,
          JSON.stringify(vehicle.pricing),
          JSON.stringify(vehicle.commission),
          vehicle.status,
          vehicle.id
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async deleteVehicle(id: string): Promise<void> {
    await this.createAutoBackup('delete-vehicle');
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM vehicles WHERE id = ?', [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Metódy pre prenájmy
  async getRentals(): Promise<Rental[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT r.*, v.brand, v.model, v.licensePlate, v.company 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicleId = v.id 
        ORDER BY r.createdAt DESC
      `, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const rentals: Rental[] = rows.map(row => ({
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
          resolve(rentals);
        }
      });
    });
  }

  async getRental(id: string): Promise<Rental | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT r.*, v.brand, v.model, v.licensePlate, v.company 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicleId = v.id 
        WHERE r.id = ?
      `, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          const rental: Rental = {
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
          };
          resolve(rental);
        } else {
          resolve(null);
        }
      });
    });
  }

  async createRental(rental: Rental): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
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
          rental.startDate.toISOString(),
          rental.endDate.toISOString(),
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
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updateRental(rental: Rental): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
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
          rental.startDate.toISOString(),
          rental.endDate.toISOString(),
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
          rental.id
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async deleteRental(id: string): Promise<void> {
    await this.createAutoBackup('delete-rental');
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM rentals WHERE id = ?', [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Metódy pre zákazníkov
  async getCustomers(): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM customers ORDER BY createdAt DESC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const customers = rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            createdAt: new Date(row.createdAt)
          }));
          resolve(customers);
        }
      });
    });
  }

  async createCustomer(customer: Customer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)',
        [customer.id, customer.name, customer.email, customer.phone],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updateCustomer(customer: Customer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?',
        [customer.name, customer.email, customer.phone, customer.id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.createAutoBackup('delete-customer');
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM customers WHERE id = ?',
        [id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Metódy pre náklady
  async getExpenses(): Promise<Expense[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM expenses ORDER BY date DESC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const expenses = rows.map((row: any) => ({
            id: row.id,
            description: row.description,
            amount: row.amount,
            date: new Date(row.date),
            vehicleId: row.vehicleId,
            company: row.company,
            category: row.category,
            note: row.note,
            createdAt: new Date(row.createdAt)
          }));
          resolve(expenses);
        }
      });
    });
  }

  async createExpense(expense: Expense): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO expenses (id, description, amount, date, vehicleId, company, category, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          expense.id,
          expense.description,
          expense.amount,
          expense.date.toISOString(),
          expense.vehicleId,
          expense.company,
          expense.category,
          expense.note
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Metódy pre poistky
  async getInsurances(): Promise<Insurance[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM insurances ORDER BY validFrom DESC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const insurances = rows.map((row: any) => ({
            id: row.id,
            vehicleId: row.vehicleId,
            type: row.type,
            validFrom: new Date(row.validFrom),
            validTo: new Date(row.validTo),
            price: row.price,
            company: row.company,
            createdAt: new Date(row.createdAt)
          }));
          resolve(insurances);
        }
      });
    });
  }

  async createInsurance(insurance: Insurance): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO insurances (id, vehicleId, type, validFrom, validTo, price, company) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          insurance.id,
          insurance.vehicleId,
          insurance.type,
          insurance.validFrom.toISOString(),
          insurance.validTo.toISOString(),
          insurance.price,
          insurance.company
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Metódy pre používateľov
  async getUserByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            createdAt: new Date(row.createdAt)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            createdAt: new Date(row.createdAt)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            createdAt: new Date(row.createdAt)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async createUser(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (id, username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          user.id, 
          user.username, 
          user.email, 
          user.password, 
          user.role, 
          new Date().toISOString()
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updateUser(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?',
        [
          user.username,
          user.email,
          user.password,
          user.role,
          user.id
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.createAutoBackup('delete-user');
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users ORDER BY createdAt DESC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const users = rows.map(row => ({
            ...row,
            createdAt: new Date(row.createdAt)
          }));
          resolve(users);
        }
      });
    });
  }

  // Metódy pre firmy
  async getCompanies(): Promise<Company[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM companies ORDER BY name ASC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const companies = rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            createdAt: new Date(row.createdAt)
          }));
          resolve(companies);
        }
      });
    });
  }

  async createCompany(company: Company): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO companies (id, name) VALUES (?, ?)',
        [company.id, company.name],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async deleteCompany(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM companies WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Metódy pre poisťovne
  async getInsurers(): Promise<Insurer[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM insurers ORDER BY name ASC', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const insurers = rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            createdAt: new Date(row.createdAt)
          }));
          resolve(insurers);
        }
      });
    });
  }

  async createInsurer(insurer: Insurer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO insurers (id, name) VALUES (?, ?)',
        [insurer.id, insurer.name],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async deleteInsurer(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM insurers WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  close() {
    this.db.close();
  }
}

export const database = new Database(); 