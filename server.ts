import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log(`[SERVER] Starting in ${process.env.NODE_ENV || 'development'} mode`);

  app.use(cors());
  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Headers: ${JSON.stringify(req.headers)}`);
    next();
  });

  // Diagnostic route
  app.get('/api/routes-check', (req, res) => {
    const routes = app._router.stack
      .filter((r: any) => r.route)
      .map((r: any) => ({
        path: r.route.path,
        methods: Object.keys(r.route.methods)
      }));
    res.json(routes);
  });

  // Database setup
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  console.log(`[SERVER] Initializing database at ${dbPath}...`);
  let db: any;
  try {
    const originalDb = new Database(dbPath, { verbose: console.log });
    // Helper to match the async sqlite API I used before
    db = {
      exec: (sql: string) => Promise.resolve(originalDb.exec(sql)),
      get: (sql: string, params: any[] = []) => Promise.resolve(originalDb.prepare(sql).get(...params)),
      all: (sql: string, params: any[] = []) => Promise.resolve(originalDb.prepare(sql).all(...params)),
      run: (sql: string, params: any[] = []) => Promise.resolve(originalDb.prepare(sql).run(...params))
    };
    console.log('[SERVER] Database connected.');
  } catch (err) {
    console.error('[SERVER] CRITICAL DATABASE ERROR:', err);
    // Don't exit immediately, try to catch the error in the logs
    setTimeout(() => process.exit(1), 5000);
  }

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT,
        tenant_id TEXT,
        avatar TEXT,
        status TEXT,
        location TEXT,
        last_login TEXT
      );

      CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        tracking_number TEXT,
        origin TEXT,
        destination TEXT,
        status TEXT,
        estimated_delivery TEXT,
        assigned_driver_id TEXT,
        current_lat REAL,
        current_lng REAL,
        location TEXT,
        history TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        title TEXT,
        description TEXT,
        priority TEXT,
        status TEXT,
        assigned_user_id TEXT,
        location TEXT,
        is_personal INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        role TEXT,
        feature TEXT,
        enabled INTEGER,
        PRIMARY KEY (role, feature)
      );

      CREATE TABLE IF NOT EXISTS inventories (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        sku TEXT UNIQUE,
        name TEXT,
        category TEXT,
        quantity INTEGER DEFAULT 0,
        price REAL,
        unit TEXT,
        location TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        sku TEXT,
        location TEXT,
        units INTEGER,
        revenue REAL,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        user_id TEXT,
        title TEXT,
        message TEXT,
        type TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        user_name TEXT,
        action TEXT,
        details TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        user_id TEXT,
        amount REAL,
        currency TEXT,
        category TEXT,
        description TEXT,
        vendor TEXT,
        date TEXT,
        status TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        name TEXT,
        plate TEXT,
        driver_name TEXT,
        driver_id TEXT,
        status TEXT,
        battery TEXT,
        temp TEXT,
        location TEXT,
        current_lat REAL,
        current_lng REAL,
        last_update TEXT
      );
    `);
    console.log('Database schema created/verified.');
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  }

  // Seed initial permissions if table is empty
  const permissionsCount = await db.get('SELECT COUNT(*) as count FROM role_permissions');
  if (permissionsCount.count === 0) {
    const roles = ['ADMIN', 'COORDINATOR', 'DRIVER', 'TEAM_MEMBER'];
    const features = ['dashboard', 'shipments', 'inventory', 'finance', 'reports', 'tasks', 'team', 'fleet', 'settings'];
    
    // Default: ADMIN has everything
    for (const f of features) {
      await db.run('INSERT INTO role_permissions (role, feature, enabled) VALUES (?, ?, ?)', ['ADMIN', f, 1]);
    }
    
    // Default: COORDINATOR has most logistics
    const coordFeatures = ['dashboard', 'shipments', 'inventory', 'tasks', 'fleet'];
    for (const f of features) {
      await db.run('INSERT INTO role_permissions (role, feature, enabled) VALUES (?, ?, ?)', 
        ['COORDINATOR', f, coordFeatures.includes(f) ? 1 : 0]);
    }

    // Default: DRIVER only basic
    const driverFeatures = ['dashboard', 'tasks'];
    for (const f of features) {
      await db.run('INSERT INTO role_permissions (role, feature, enabled) VALUES (?, ?, ?)', 
        ['DRIVER', f, driverFeatures.includes(f) ? 1 : 0]);
    }

    // Default: TEAM_MEMBER
    const memberFeatures = ['dashboard'];
    for (const f of features) {
      await db.run('INSERT INTO role_permissions (role, feature, enabled) VALUES (?, ?, ?)', 
        ['TEAM_MEMBER', f, memberFeatures.includes(f) ? 1 : 0]);
    }
  }

  // Seed initial admin if not exists
  console.log('Verifying default user accounts...');
  const defaultUsers = [
    ['USR-001', 'admin@swiftconnect.com', 'admin123', 'Super Admin', 'ADMIN', 'TENANT-001', 'SA', 'ACTIVE', 'HQ'],
    ['USR-002', 'manager@swiftconnect.com', 'manager123', 'Ops Manager', 'COORDINATOR', 'TENANT-001', 'OM', 'ACTIVE', 'NORTH-HUB'],
    ['USR-003', 'driver@swiftconnect.com', 'driver123', 'Fleet Driver', 'DRIVER', 'TENANT-001', 'FD', 'ACTIVE', 'NORTH-HUB'],
    ['USR-004', 'officer@swiftconnect.com', 'officer123', 'Field Officer', 'TEAM_MEMBER', 'TENANT-001', 'FO', 'ACTIVE', 'SOUTH-HUB']
  ];

  for (const u of defaultUsers) {
    await db.run(
      'INSERT OR REPLACE INTO users (id, email, password, name, role, tenant_id, avatar, status, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      u
    );
  }

  // Seed shipments if empty
  const shipmentsCount = await db.get('SELECT COUNT(*) as count FROM shipments');
  if (shipmentsCount.count === 0) {
    const initialShipments = [
      ['SH-101', 'TENANT-001', 'SW-90210-A', 'New York Port', 'Distribution Center A, NJ', 'IN_TRANSIT', '2026-05-06T14:00:00Z', 'DRV-001', 40.7128, -74.0060, 'NORTH-HUB', JSON.stringify([
        { status: 'PENDING', note: 'Shipment created and awaiting pickup.', location: 'New York Port', timestamp: '2026-05-01T08:00:00Z' },
        { status: 'IN_TRANSIT', note: 'Package has been picked up by the driver.', location: 'New York Port', timestamp: '2026-05-01T10:30:00Z' },
        { status: 'IN_TRANSIT', note: 'Arrived at sorting facility.', location: 'Jersey City Terminal', timestamp: '2026-05-03T15:00:00Z' }
      ]), '2026-05-01T08:00:00Z', '2026-05-05T10:00:00Z'],
      ['SH-102', 'TENANT-001', 'SW-90211-B', 'Los Angeles Hub', 'Retail Store 42, CA', 'DELIVERED', '2026-05-04T16:30:00Z', 'DRV-002', 34.0522, -118.2437, 'NORTH-HUB', JSON.stringify([
        { status: 'PENDING', note: 'Logistics request received.', location: 'Los Angeles Hub', timestamp: '2026-05-02T09:00:00Z' },
        { status: 'IN_TRANSIT', note: 'Departed from origin hub.', location: 'Los Angeles Hub', timestamp: '2026-05-02T11:00:00Z' },
        { status: 'IN_TRANSIT', note: 'In transit to final destination.', location: 'Santa Monica', timestamp: '2026-05-03T14:00:00Z' },
        { status: 'DELIVERED', note: 'Successfully delivered to retail store.', location: 'Retail Store 42, CA', timestamp: '2026-05-04T16:30:00Z' }
      ]), '2026-05-02T09:00:00Z', '2026-05-04T16:30:00Z'],
      ['SH-103', 'TENANT-001', 'SW-90212-C', 'Dallas Logistics Center', 'Warehouse 09, TX', 'DELAYED', '2026-05-05T18:00:00Z', 'DRV-003', 32.7767, -96.7970, 'SOUTH-HUB', JSON.stringify([
        { status: 'PENDING', note: 'Assigned to Dallas fleet.', location: 'Dallas Logistics Center', timestamp: '2026-05-03T11:00:00Z' },
        { status: 'IN_TRANSIT', note: 'Departed Dallas hub.', location: 'Dallas Logistics Center', timestamp: '2026-05-04T08:00:00Z' },
        { status: 'DELAYED', note: 'Vehicle maintenance issue reported.', location: 'Waco, TX', timestamp: '2026-05-05T07:00:00Z' }
      ]), '2026-05-03T11:00:00Z', '2026-05-05T07:00:00Z']
    ];
    for (const s of initialShipments) {
      await db.run(
        'INSERT INTO shipments (id, tenant_id, tracking_number, origin, destination, status, estimated_delivery, assigned_driver_id, current_lat, current_lng, location, history, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        s
      );
    }
  }

  // Seed tasks if empty
  const tasksCount = await db.get('SELECT COUNT(*) as count FROM tasks');
  if (tasksCount.count === 0) {
    const initialTasks = [
      ['T-1', 'TENANT-001', 'Review driver documentation', 'Check license expiration for newly onboarded drivers.', 'HIGH', 'TODO', 'USR-002', 'NORTH-HUB', 0, '2026-05-04T09:00:00Z', '2026-05-04T09:00:00Z'],
      ['T-2', 'TENANT-001', 'Maintenance VK-902', 'Scheduled oil change and brake inspection.', 'MEDIUM', 'IN_PROGRESS', 'USR-001', 'HQ', 0, '2026-05-04T10:00:00Z', '2026-05-04T10:00:00Z'],
      ['T-3', 'TENANT-001', 'Quarterly compliance audit', 'Ensure all shipments from Q1 have proper insurance records.', 'LOW', 'COMPLETED', null, 'SOUTH-HUB', 0, '2026-05-01T14:00:00Z', '2026-05-01T14:00:00Z']
    ];
    for (const t of initialTasks) {
      await db.run(
        'INSERT INTO tasks (id, tenant_id, title, description, priority, status, assigned_user_id, location, is_personal, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        t
      );
    }
  }

  // Seed vehicles if empty
  const vehiclesCount = await db.get('SELECT COUNT(*) as count FROM vehicles');
  if (vehiclesCount.count === 0) {
    const initialVehicles = [
      ['VK-902', 'TENANT-001', 'Volvo FH16', 'NJ-8821', 'Marco Rossi', 'DRV-001', 'ACTIVE', '82%', '18°C', 'Near Newark', 40.7128, -74.0060, new Date().toISOString()],
      ['VK-331', 'TENANT-001', 'Mercedes Actros', 'NY-1022', 'Elena Petrova', 'DRV-002', 'IDLE', '95%', '20°C', 'Brooklyn Depot', 40.6782, -73.9442, new Date().toISOString()],
      ['VK-440', 'TENANT-001', 'Scania R500', 'TX-4491', 'Sam Wilson', 'DRV-003', 'MAINTENANCE', '12%', '24°C', 'Austin Service', 30.2672, -97.7431, new Date().toISOString()],
      ['VK-112', 'TENANT-001', 'Isuzu NPR', 'CA-9920', 'Tanaka Ken', 'USR-003', 'ACTIVE', '45%', '19°C', 'I-5 North', 34.0522, -118.2437, new Date().toISOString()],
    ];
    for (const v of initialVehicles) {
      await db.run(
        'INSERT INTO vehicles (id, tenant_id, name, plate, driver_name, driver_id, status, battery, temp, location, current_lat, current_lng, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        v
      );
    }
  }

  // Seed expenses if empty
  const expensesCount = await db.get('SELECT COUNT(*) as count FROM expenses');
  if (expensesCount.count === 0) {
    const initialExpenses = [
      ['EXP-001', 'TENANT-001', 'USR-004', 150.50, 'USD', 'Travel', 'Uber to Airport', 'Uber', '2026-05-01', 'RECEIVED', '2026-05-01T09:00:00Z', '2026-05-04T10:00:00Z'],
      ['EXP-002', 'TENANT-001', 'USR-001', 45.00, 'USD', 'Food', 'Client Lunch', 'Starbucks', '2026-05-03', 'APPROVED', '2026-05-03T13:00:00Z', '2026-05-04T09:00:00Z']
    ];
    for (const e of initialExpenses) {
      await db.run(
        'INSERT INTO expenses (id, tenant_id, user_id, amount, currency, category, description, vendor, date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        e
      );
    }
  }

  // Seed inventory if empty
  const invCount = await db.get('SELECT COUNT(*) as count FROM inventories');
  if (invCount.count === 0) {
    const initialInv = [
      ['INV-001', 'TENANT-001', 'SKU-LOG-01', 'Heavy Duty Pallet', 'Logistics', 500, 45.00, 'unit', 'NORTH-HUB', new Date().toISOString()],
      ['INV-002', 'TENANT-001', 'SKU-LOG-02', 'Packaging Shrink Wrap', 'Materials', 120, 12.50, 'roll', 'SOUTH-HUB', new Date().toISOString()],
      ['INV-003', 'TENANT-001', 'SKU-LOG-03', 'Rachet Straps (4pk)', 'Fleet Gear', 85, 29.99, 'set', 'HQ', new Date().toISOString()]
    ];
    for (const i of initialInv) {
      await db.run(
        'INSERT INTO inventories (id, tenant_id, sku, name, category, quantity, price, unit, location, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        i
      );
    }
  }

  // Seed sales if empty
  const salesCount = await db.get('SELECT COUNT(*) as count FROM sales');
  if (salesCount.count === 0) {
    const locations = ['HQ', 'NORTH-HUB', 'SOUTH-HUB', 'EAST-HUB', 'WEST-HUB'];
    const skus = ['SKU-LOG-01', 'SKU-LOG-02', 'SKU-LOG-03'];
    const now = new Date();
    
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      const timestamp = date.toISOString();
      
      for (const loc of locations) {
        for (const sku of skus) {
          const units = Math.floor(Math.random() * 20) + 1;
          const price = sku === 'SKU-LOG-01' ? 45.00 : (sku === 'SKU-LOG-02' ? 12.50 : 29.99);
          const revenue = units * price;
          
          await db.run(
            'INSERT INTO sales (id, tenant_id, sku, location, units, revenue, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [`SALE-${Date.now()}-${Math.random()}`, 'TENANT-001', sku, loc, units, revenue, timestamp]
          );
        }
      }
    }
  }

  console.log('Default users verified.');
  const users = await db.all('SELECT email, password FROM users');
  console.log('Users in DB:', users.map((u: any) => `${u.email}:${u.password}`).join(', '));

  // Auth Middleware
  const authMiddleware = async (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  };

  const adminMiddleware = (req: any, res: any, next: any) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Permission denied' });
    next();
  };

  // API Routes
  app.get('/api/health', async (req, res) => {
    try {
      const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
      const permsCount = await db.get('SELECT COUNT(*) as count FROM role_permissions');
      const allUsers = await db.all('SELECT email, password FROM users');
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: {
          users: usersCount.count,
          permissions: permsCount.count,
          emails: allUsers.map((u: any) => u.email)
        }
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: String(err) });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    console.log('[AUTH] Login route hit');
    console.log('[AUTH] Body type:', typeof req.body);
    console.log('[AUTH] Body keys:', Object.keys(req.body || {}));
    
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for email: "${email}" with password length: ${password?.length || 0}`);
    
    if (!email || !password) {
      console.log('[AUTH] Missing credentials in request body');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
      if (!user) {
        console.log(`[AUTH] Login failed for ${email}: Invalid credentials`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      console.log(`[AUTH] Login success for ${email}: ${user.name} (${user.role})`);

      const lastLogin = new Date().toISOString();
      await db.run('UPDATE users SET last_login = ? WHERE id = ?', [lastLogin, user.id]);
      await db.run(
        'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.name, 'LOGIN', 'Successful terminal access', lastLogin]
      );

      res.json(user);
    } catch (err) {
      console.error(`[AUTH] Login error for ${email}:`, err);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  });

  app.post('/api/login', (req, res) => {
    res.status(405).json({ error: 'Please use /api/auth/login' });
  });

  app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    const users = await db.all('SELECT id, email, name, role, tenant_id, avatar, status, location, last_login FROM users');
    res.json(users);
  });

  app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    const { email, name, role, password, location } = req.body;
    const id = `USR-${Math.floor(Math.random() * 10000)}`;
    await db.run(
      'INSERT INTO users (id, email, name, role, password, tenant_id, avatar, status, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, email, name, role, password || 'password123', (req as any).user.tenant_id, name.charAt(0).toUpperCase(), 'ACTIVE', location || 'HQ']
    );
    await db.run(
      'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [(req as any).user.id, (req as any).user.name, 'CREATE_USER', `Created user ${email} at ${location}`, new Date().toISOString()]
    );
    res.json({ id, email, name, role, location });
  });

  app.put('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { name, role, status, location } = req.body;
    await db.run(
      'UPDATE users SET name = ?, role = ?, status = ?, location = ? WHERE id = ?',
      [name, role, status, location, req.params.id]
    );
    await db.run(
      'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [(req as any).user.id, (req as any).user.name, 'UPDATE_USER', `Updated user ${req.params.id}`, new Date().toISOString()]
    );
    res.json({ success: true });
  });

  // Shipments API
  app.get('/api/shipments', authMiddleware, async (req, res) => {
    const user = (req as any).user;
    let query = 'SELECT * FROM shipments WHERE tenant_id = ?';
    let params = [user.tenant_id];

    if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
      query += ' AND location = ?';
      params.push(user.location);
    }

    const shipments = await db.all(query, params);
    // Parse JSON fields
    const parsedShipments = shipments.map((s: any) => ({
      ...s,
      history: s.history ? JSON.parse(s.history) : []
    }));
    res.json(parsedShipments);
  });

  app.post('/api/shipments', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const { origin, destination, estimatedDelivery, trackingNumber } = req.body;
    const id = `SH-${Date.now()}`;
    const tn = trackingNumber || `SW-${Math.floor(10000 + Math.random() * 90000)}-${id.slice(-1)}`;
    const createdAt = new Date().toISOString();
    
    const history = JSON.stringify([{
      status: 'PENDING',
      note: 'Shipment created and awaiting pickup.',
      location: origin,
      timestamp: createdAt
    }]);

    await db.run(
      'INSERT INTO shipments (id, tenant_id, tracking_number, origin, destination, status, estimated_delivery, current_lat, current_lng, location, history, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.tenant_id, tn, origin, destination, 'PENDING', estimatedDelivery, 40.7128, -74.0060, origin, history, createdAt, createdAt]
    );

    res.json({ id, trackingNumber: tn });
  });

  app.put('/api/shipments/:id', authMiddleware, async (req, res) => {
    const { status, location: currentLoc, note } = req.body;
    const updatedAt = new Date().toISOString();
    
    const shipment = await db.get('SELECT history FROM shipments WHERE id = ?', [req.params.id]);
    const history = JSON.parse(shipment.history || '[]');
    history.push({
      status,
      note: note || `Status updated to ${status}`,
      location: currentLoc || 'Transit Point',
      timestamp: updatedAt
    });

    await db.run(
      'UPDATE shipments SET status = ?, location = ?, history = ?, updated_at = ? WHERE id = ?',
      [status, currentLoc || 'Transit Point', JSON.stringify(history), updatedAt, req.params.id]
    );
    res.json({ success: true, updatedAt });
  });

  app.put('/api/shipments/:id/assign', authMiddleware, async (req: any, res) => {
    const { driverId } = req.body;
    const updatedAt = new Date().toISOString();
    await db.run(
      'UPDATE shipments SET assigned_driver_id = ?, updated_at = ? WHERE id = ?',
      [driverId, updatedAt, req.params.id]
    );
    res.json({ success: true, updatedAt });
  });

  app.put('/api/shipments/:id/location', authMiddleware, async (req, res) => {
    const { field, value } = req.body;
    const updatedAt = new Date().toISOString();
    if (field === 'origin') {
      await db.run('UPDATE shipments SET origin = ?, updated_at = ? WHERE id = ?', [value, updatedAt, req.params.id]);
    } else {
      await db.run('UPDATE shipments SET destination = ?, updated_at = ? WHERE id = ?', [value, updatedAt, req.params.id]);
    }
    res.json({ success: true, updatedAt });
  });

  // Tasks API
  app.get('/api/tasks', authMiddleware, async (req, res) => {
    const user = (req as any).user;
    let query = 'SELECT * FROM tasks WHERE tenant_id = ?';
    let params = [user.tenant_id];

    if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
      query += ' AND (location = ? OR assigned_user_id = ?)';
      params.push(user.location, user.id);
    }

    const tasks = await db.all(query, params);
    res.json(tasks);
  });

  app.post('/api/tasks', authMiddleware, async (req, res) => {
    const { title, description, priority, location, is_personal } = req.body;
    const id = `T-${Date.now()}`;
    const user = (req as any).user;
    const createdAt = new Date().toISOString();
    await db.run(
      'INSERT INTO tasks (id, tenant_id, title, description, priority, status, assigned_user_id, location, is_personal, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.tenant_id, title, description, priority || 'MEDIUM', 'TODO', user.id, location || user.location, is_personal ? 1 : 0, createdAt, createdAt]
    );
    res.json({ id, title, createdAt });
  });

  app.put('/api/tasks/:id/status', authMiddleware, async (req, res) => {
    const { status } = req.body;
    const updatedAt = new Date().toISOString();
    await db.run('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [status, updatedAt, req.params.id]);
    res.json({ success: true, updatedAt });
  });

  // Inventory API
  app.get('/api/inventory', authMiddleware, async (req, res) => {
    const user = (req as any).user;
    let query = 'SELECT * FROM inventories WHERE tenant_id = ?';
    let params = [user.tenant_id];

    if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
      query += ' AND location = ?';
      params.push(user.location);
    }

    const items = await db.all(query, params);
    res.json(items);
  });

  app.post('/api/inventory', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const { name, sku, category, quantity, price, unit, location } = req.body;
    const id = `INV-${Date.now()}`;
    const updatedAt = new Date().toISOString();
    
    await db.run(
      'INSERT INTO inventories (id, tenant_id, sku, name, category, quantity, price, unit, location, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.tenant_id, sku, name, category, quantity || 0, price || 0, unit || 'unit', location || user.location, updatedAt]
    );

    res.json({ id, sku });
  });

  app.put('/api/inventory/:id/stock', authMiddleware, async (req: any, res) => {
    const { quantity } = req.body;
    const updatedAt = new Date().toISOString();
    await db.run('UPDATE inventories SET quantity = ?, updated_at = ? WHERE id = ?', [quantity, updatedAt, req.params.id]);
    res.json({ success: true, updatedAt });
  });

  app.put('/api/inventory/:id/price', authMiddleware, async (req, res) => {
    const { price, name } = req.body;
    const user = (req as any).user;

    if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Only Managers can governance product pricing.' });
    }

    const item = await db.get('SELECT price FROM inventories WHERE id = ?', [req.params.id]);
    const oldPrice = item.price;
    const updatedAt = new Date().toISOString();

    await db.run(
      'UPDATE inventories SET price = ?, updated_at = ? WHERE id = ?',
      [price, updatedAt, req.params.id]
    );

    // Automated Alerts: Notify entire team
    const team = await db.all('SELECT id FROM users WHERE tenant_id = ?', [user.tenant_id]);
    const notificationId = `NOTIF-${Date.now()}`;
    for (const member of team) {
      await db.run(
        'INSERT INTO notifications (id, tenant_id, user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          `${notificationId}-${member.id}`,
          user.tenant_id,
          member.id,
          'Price Governance Update',
          `Automated Alert: The price for ${name} has been updated from $${oldPrice} to $${price} by ${user.name}.`,
          'PRICING_UPDATE',
          updatedAt
        ]
      );
    }

    await db.run(
      'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, 'PRICE_CHANGE', `Updated ${name} price to ${price}`, updatedAt]
    );

    res.json({ success: true, updatedAt });
  });

  // Fleet API
  app.get('/api/fleet', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const vehicles = await db.all('SELECT * FROM vehicles WHERE tenant_id = ?', [user.tenant_id]);
    res.json(vehicles);
  });

  app.post('/api/fleet', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const { name, plate, driverName, driverId, location } = req.body;
    const id = `VK-${Math.floor(100 + Math.random() * 900)}`;
    const lastUpdate = new Date().toISOString();
    
    await db.run(
      'INSERT INTO vehicles (id, tenant_id, name, plate, driver_name, driver_id, status, battery, temp, location, current_lat, current_lng, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.tenant_id, name, plate, driverName || 'Unassigned', driverId || null, 'IDLE', '100%', '20°C', location || 'Depot', 40.7128, -74.0060, lastUpdate]
    );

    res.json({ id, plate });
  });

  app.put('/api/fleet/:id/telemetry', authMiddleware, async (req: any, res) => {
    const { status, lat, lng, location } = req.body;
    const lastUpdate = new Date().toISOString();
    await db.run(
      'UPDATE vehicles SET status = ?, current_lat = ?, current_lng = ?, location = ?, last_update = ? WHERE id = ?',
      [status, lat, lng, location, lastUpdate, req.params.id]
    );
    res.json({ success: true, lastUpdate });
  });

  // Finance API
  app.get('/api/finance/expenses', authMiddleware, async (req: any, res) => {
    const user = req.user;
    let query = 'SELECT * FROM expenses WHERE tenant_id = ?';
    let params = [user.tenant_id];
    
    // Non-admins only see their own expenses or those in their location
    if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
      query += ' AND user_id = ?';
      params.push(user.id);
    }
    
    const expenses = await db.all(query, params);
    res.json(expenses);
  });

  app.post('/api/finance/expenses', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const { vendor, amount, currency, category, description, date } = req.body;
    const id = `EXP-${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    await db.run(
      'INSERT INTO expenses (id, tenant_id, user_id, amount, currency, category, description, vendor, date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.tenant_id, user.id, amount, currency || 'USD', category, description, vendor, date, 'PENDING', createdAt, createdAt]
    );
    
    res.json({ id, status: 'PENDING' });
  });

  app.put('/api/finance/expenses/:id/status', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const { status } = req.body;
    const updatedAt = new Date().toISOString();
    
    // Only admins/coordinators can approve/reject, unless it's a driver confirming receipt
    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    
    const isApproval = status === 'APPROVED' || status === 'REJECTED' || status === 'SENT';
    if (isApproval && user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    await db.run('UPDATE expenses SET status = ?, updated_at = ? WHERE id = ?', [status, updatedAt, req.params.id]);
    res.json({ success: true, updatedAt });
  });

  // Dashboard API
  app.get('/api/dashboard/stats', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const tenantId = user.tenant_id;

    const shipments = await db.all('SELECT status FROM shipments WHERE tenant_id = ?', [tenantId]);
    const alerts = await db.get('SELECT COUNT(*) as count FROM notifications WHERE tenant_id = ? AND is_read = 0 AND type = "ALERT"', [tenantId]);
    const fleet = await db.all('SELECT status FROM vehicles WHERE tenant_id = ?', [tenantId]);

    const activeShipments = shipments.filter((s: any) => s.status === 'IN_TRANSIT').length;
    const deliveredCount = shipments.filter((s: any) => s.status === 'DELIVERED').length;
    const onTimeRate = shipments.length > 0 ? (deliveredCount / shipments.length) * 100 : 100;

    res.json({
      activeShipments,
      onTimeRate: onTimeRate.toFixed(1),
      inTransit: activeShipments, // Simplification
      criticalAlerts: alerts.count,
      fleetSummary: {
        active: fleet.filter((v: any) => v.status === 'ACTIVE').length,
        idle: fleet.filter((v: any) => v.status === 'IDLE').length,
        maintenance: fleet.filter((v: any) => v.status === 'MAINTENANCE').length,
      }
    });
  });

  app.get('/api/dashboard/revenue', authMiddleware, async (req: any, res) => {
    const user = req.user;
    // Get last 7 days of revenue from sales
    try {
      const revenue = await db.all(`
        SELECT 
          strftime('%a', timestamp) as name,
          SUM(revenue) as value
        FROM sales
        WHERE tenant_id = ? AND timestamp >= date('now', '-7 days')
        GROUP BY name
        ORDER BY timestamp ASC
      `, [user.tenant_id]);
      res.json(revenue);
    } catch (err) {
      console.error('Revenue API error:', err);
      res.json([
        { name: 'Mon', value: 400 },
        { name: 'Tue', value: 300 },
        { name: 'Wed', value: 450 },
        { name: 'Thu', value: 550 },
        { name: 'Fri', value: 350 },
        { name: 'Sat', value: 200 },
        { name: 'Sun', value: 150 },
      ]);
    }
  });

  // Notifications API
  app.get('/api/notifications', authMiddleware, async (req, res) => {
    const user = (req as any).user;
    const items = await db.all(
      'SELECT * FROM notifications WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50',
      [user.tenant_id, user.id]
    );
    res.json(items);
  });

  app.post('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    await db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Reports API [cite: 21, 23, 24]
  app.get('/api/reports/sales-summary', authMiddleware, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Access restricted to Management.' });
    }

    try {
      const summary = await db.all(`
        SELECT 
          location,
          SUM(revenue) as total_revenue,
          SUM(units) as total_units,
          COUNT(*) as transaction_count
        FROM sales
        WHERE tenant_id = ?
        GROUP BY location
      `, [user.tenant_id]);

      const performance = await db.all(`
        SELECT 
          s.sku,
          i.name,
          SUM(s.revenue) as revenue,
          SUM(s.units) as units_sold,
          i.quantity as current_stock,
          (CAST(SUM(s.units) AS FLOAT) / (NULLIF(i.quantity, 0))) as stock_to_sales_ratio
        FROM sales s
        JOIN inventories i ON s.sku = i.sku
        WHERE s.tenant_id = ?
        GROUP BY s.sku
      `, [user.tenant_id]);

      res.json({ summary, performance });
    } catch (err) {
      console.error('Report Error:', err);
      res.status(500).json({ error: 'Failed to generate reporting analytics.' });
    }
  });

  app.get('/api/reports/drilldown/:location', authMiddleware, async (req, res) => {
    const user = (req as any).user;
    try {
      const detail = await db.all(`
        SELECT 
          sku,
          SUM(units) as units,
          SUM(revenue) as revenue
        FROM sales
        WHERE tenant_id = ? AND location = ?
        GROUP BY sku
      `, [user.tenant_id, req.params.location]);

      res.json(detail);
    } catch (err) {
      res.status(500).json({ error: 'Drilldown retrieval failure.' });
    }
  });

  app.post('/api/users/:id/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
    const newPassword = 'reset' + Math.floor(Math.random() * 1000);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, req.params.id]);
    await db.run(
      'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [(req as any).user.id, (req as any).user.name, 'RESET_PASSWORD', `Reset password for user ${req.params.id}`, new Date().toISOString()]
    );
    res.json({ newPassword });
  });

  app.get('/api/audit-logs', authMiddleware, adminMiddleware, async (req, res) => {
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
    res.json(logs);
  });

  app.get('/api/drivers', authMiddleware, async (req: any, res) => {
    const drivers = await db.all('SELECT id, name FROM users WHERE role = "DRIVER" AND tenant_id = ?', [req.user.tenant_id]);
    res.json(drivers);
  });
  
  app.put('/api/profile', authMiddleware, async (req, res) => {
    const { name, password } = req.body;
    const user = (req as any).user;
    
    if (name) {
      await db.run('UPDATE users SET name = ? WHERE id = ?', [name, user.id]);
    }
    
    if (password) {
      await db.run('UPDATE users SET password = ? WHERE id = ?', [password, user.id]);
    }
    
    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    
    await db.run(
      'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, 'UPDATE_PROFILE', `Updated profile (name: ${!!name}, password: ${!!password})`, new Date().toISOString()]
    );
    
    res.json(updatedUser);
  });

  app.get('/api/permissions', authMiddleware, async (req, res) => {
    const permissions = await db.all('SELECT * FROM role_permissions');
    res.json(permissions);
  });

  app.put('/api/permissions', authMiddleware, adminMiddleware, async (req, res) => {
    const { role, feature, enabled } = req.body;
    await db.run(
      'INSERT OR REPLACE INTO role_permissions (role, feature, enabled) VALUES (?, ?, ?)',
      [role, feature, enabled ? 1 : 0]
    );
    await db.run(
      'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [(req as any).user.id, (req as any).user.name, 'UPDATE_PERMISSION', `Updated ${feature} access for ${role} to ${enabled}`, new Date().toISOString()]
    );
    res.json({ success: true });
  });

  // API 404 Catch-all - to identify if requests miss the routes
  app.all('/api/*', (req, res) => {
    console.warn(`[SERVER] API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found on terminal server.` });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initializing Vite middleware...');
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware integrated.');
    } catch (err) {
      console.error('Failed to initialize Vite:', err);
      process.exit(1);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
