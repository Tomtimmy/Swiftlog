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

  app.use(cors());
  app.use(express.json());

  // Database setup
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  console.log(`Initializing database at ${dbPath}...`);
  let db: any;
  try {
    db = new Database(dbPath);
    // Helper to match the async sqlite API I used before
    const originalDb = db;
    db = {
      exec: (sql: string) => Promise.resolve(originalDb.exec(sql)),
      get: (sql: string, params: any[] = []) => Promise.resolve(originalDb.prepare(sql).get(...params)),
      all: (sql: string, params: any[] = []) => Promise.resolve(originalDb.prepare(sql).all(...params)),
      run: (sql: string, params: any[] = []) => Promise.resolve(originalDb.prepare(sql).run(...params))
    };
    console.log('Database connected.');
  } catch (err) {
    console.error('Failed to connect to database at ' + dbPath + ':', err);
    process.exit(1);
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
        last_login TEXT
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        role TEXT,
        feature TEXT,
        enabled INTEGER,
        PRIMARY KEY (role, feature)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        user_name TEXT,
        action TEXT,
        details TEXT,
        timestamp TEXT
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
    ['USR-001', 'admin@swiftconnect.com', 'admin123', 'Super Admin', 'ADMIN', 'TENANT-001', 'SA', 'ACTIVE'],
    ['USR-002', 'manager@swiftconnect.com', 'manager123', 'Ops Manager', 'COORDINATOR', 'TENANT-001', 'OM', 'ACTIVE'],
    ['USR-003', 'driver@swiftconnect.com', 'driver123', 'Fleet Driver', 'DRIVER', 'TENANT-001', 'FD', 'ACTIVE']
  ];

  for (const u of defaultUsers) {
    await db.run(
      'INSERT OR REPLACE INTO users (id, email, password, name, role, tenant_id, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      u
    );
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
    const { email, password } = req.body;
    console.log(`Login attempt for ${email}`);
    try {
      const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
      if (!user) {
        console.log(`Login failed for ${email}: Invalid credentials`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      console.log(`Login success for ${email}: ${user.name} (${user.role})`);

      const lastLogin = new Date().toISOString();
      await db.run('UPDATE users SET last_login = ? WHERE id = ?', [lastLogin, user.id]);
      await db.run(
        'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.name, 'LOGIN', 'Successful terminal access', lastLogin]
      );

      res.json(user);
    } catch (err) {
      console.error(`Login error for ${email}:`, err);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  });

  app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    const users = await db.all('SELECT id, email, name, role, tenant_id, avatar, status, last_login FROM users');
    res.json(users);
  });

  app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    const { email, name, role, password } = req.body;
    const id = `USR-${Math.floor(Math.random() * 10000)}`;
    await db.run(
      'INSERT INTO users (id, email, name, role, password, tenant_id, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, email, name, role, password || 'password123', (req as any).user.tenant_id, name.charAt(0).toUpperCase(), 'ACTIVE']
    );
    await db.run(
      'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [(req as any).user.id, (req as any).user.name, 'CREATE_USER', `Created user ${email}`, new Date().toISOString()]
    );
    res.json({ id, email, name, role });
  });

  app.put('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { name, role, status } = req.body;
    await db.run(
      'UPDATE users SET name = ?, role = ?, status = ? WHERE id = ?',
      [name, role, status, req.params.id]
    );
    await db.run(
      'INSERT INTO audit_logs (user_id, user_name, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [(req as any).user.id, (req as any).user.name, 'UPDATE_USER', `Updated user ${req.params.id}`, new Date().toISOString()]
    );
    res.json({ success: true });
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
