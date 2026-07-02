import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

interface SignupEvent {
  timestamp: string;
  source: 'website' | 'facebook-lead';
  email: string;
  status: 'success' | 'duplicate' | 'error';
  userId?: string;
  errorCode?: number;
  errorMsg?: string;
}

interface DashboardStats {
  today: {
    total: number;
    success: number;
    duplicate: number;
    error: number;
    successRate: number;
    bySource: {
      website: number;
      facebook: number;
    };
  };
  lastHour: {
    total: number;
    success: number;
  };
  recent: SignupEvent[];
  errors: Array<{ code: number; count: number; msg: string }>;
}

/**
 * Initialize database connection
 * Creates analytics.db in Vercel .vercel/output/functions or local .data
 */
function getDatabase(): Database.Database {
  if (db) return db;

  try {
    // Determine safe data directory
    // On Vercel: use /tmp (persists within container instance, ~30+ min lifecycle)
    // Locally: use .data directory
    const dataDir = process.env.VERCEL === '1' ? '/tmp' : path.join(process.cwd(), '.data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'analytics.db');
    db = new Database(dbPath);

    // Enable foreign keys
    db.pragma('journal_mode = WAL');

    // Create schema if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS signup_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        source TEXT NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL,
        userId TEXT,
        errorCode INTEGER,
        errorMsg TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON signup_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_source ON signup_events(source);
      CREATE INDEX IF NOT EXISTS idx_status ON signup_events(status);
      CREATE INDEX IF NOT EXISTS idx_email ON signup_events(email);
    `);

    console.log('✅ Analytics database initialized');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Log a signup event (non-blocking)
 * Does NOT throw—logs errors internally
 */
export function logSignupEvent(event: SignupEvent): void {
  try {
    const database = getDatabase();
    const stmt = database.prepare(`
      INSERT INTO signup_events (timestamp, source, email, status, userId, errorCode, errorMsg)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.timestamp,
      event.source,
      event.email,
      event.status,
      event.userId || null,
      event.errorCode || null,
      event.errorMsg || null
    );

    console.log(`📊 Event logged: ${event.source} | ${event.email} | ${event.status}`);
  } catch (error) {
    // CRITICAL: Never block signup on logging failure
    console.error('⚠️ Analytics logging failed (non-blocking):', error);
  }
}

/**
 * Get dashboard statistics
 */
export function getDashboardStats(): DashboardStats {
  try {
    const database = getDatabase();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString()
      .split('T')[0];
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    // Today's stats
    const todayStats = database
      .prepare(
        `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status = 'duplicate' THEN 1 ELSE 0 END) as duplicate,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
          SUM(CASE WHEN source = 'website' THEN 1 ELSE 0 END) as website,
          SUM(CASE WHEN source = 'facebook-lead' THEN 1 ELSE 0 END) as facebook
        FROM signup_events
        WHERE DATE(timestamp) = ?
      `
      )
      .get(todayStart) as any;

    // Last hour stats
    const lastHourStats = database
      .prepare(
        `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
        FROM signup_events
        WHERE timestamp > ?
      `
      )
      .get(hourAgo) as any;

    // Recent 20 events
    const recent = database
      .prepare(
        `
        SELECT timestamp, source, email, status, userId, errorCode, errorMsg
        FROM signup_events
        ORDER BY timestamp DESC
        LIMIT 20
      `
      )
      .all() as SignupEvent[];

    // Error breakdown
    const errors = database
      .prepare(
        `
        SELECT 
          errorCode,
          COUNT(*) as count,
          MAX(errorMsg) as msg
        FROM signup_events
        WHERE status = 'error' AND errorCode IS NOT NULL
        GROUP BY errorCode
        ORDER BY count DESC
      `
      )
      .all() as any[];

    const successRate =
      todayStats.total > 0 ? Math.round((todayStats.success / todayStats.total) * 100) : 0;

    return {
      today: {
        total: todayStats.total || 0,
        success: todayStats.success || 0,
        duplicate: todayStats.duplicate || 0,
        error: todayStats.error || 0,
        successRate,
        bySource: {
          website: todayStats.website || 0,
          facebook: todayStats.facebook || 0,
        },
      },
      lastHour: {
        total: lastHourStats.total || 0,
        success: lastHourStats.success || 0,
      },
      recent,
      errors: errors.map((e) => ({
        code: e.errorCode,
        count: e.count,
        msg: e.msg || 'Unknown error',
      })),
    };
  } catch (error) {
    console.error('❌ Failed to fetch dashboard stats:', error);
    return {
      today: {
        total: 0,
        success: 0,
        duplicate: 0,
        error: 0,
        successRate: 0,
        bySource: { website: 0, facebook: 0 },
      },
      lastHour: { total: 0, success: 0 },
      recent: [],
      errors: [],
    };
  }
}

/**
 * Export emails for marketing
 * Returns array of unique emails with optional filtering
 */
export function exportEmails(options?: {
  daysBack?: number;
  source?: 'website' | 'facebook-lead' | 'all';
  statusOnly?: 'success' | 'duplicate' | 'all';
}): string[] {
  try {
    const database = getDatabase();
    const daysBack = options?.daysBack || 30;
    const source = options?.source || 'all';
    const statusOnly = options?.statusOnly || 'success';

    const cutoffDate = new Date(new Date().getTime() - daysBack * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let query = `
      SELECT DISTINCT email
      FROM signup_events
      WHERE DATE(timestamp) >= ?
    `;
    const params: any[] = [cutoffDate];

    if (source !== 'all') {
      query += ` AND source = ?`;
      params.push(source);
    }

    if (statusOnly !== 'all') {
      query += ` AND status = ?`;
      params.push(statusOnly);
    }

    query += ` ORDER BY email`;

    const rows = database.prepare(query).all(...params) as any[];
    return rows.map((r) => r.email);
  } catch (error) {
    console.error('❌ Failed to export emails:', error);
    return [];
  }
}

/**
 * Close database connection (cleanup)
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

export default {
  logSignupEvent,
  getDashboardStats,
  exportEmails,
  closeDatabase,
};
