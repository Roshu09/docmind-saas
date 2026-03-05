// Direct migration runner - bypasses node-pg-migrate entirely
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const runMigrations = async () => {
  const client = await pool.connect();
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pgmigrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Get already-run migrations
    const { rows: done } = await client.query('SELECT name FROM pgmigrations');
    const completed = done.map(r => r.name);

    // Load migration files
    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of files) {
      if (completed.includes(file)) {
        console.log(`⏭  Skipping: ${file}`);
        continue;
      }

      console.log(`▶  Running: ${file}`);
      const mod = await import(`./migrations/${file}`);

      // Simple pgm object that wraps client.query
      const pgm = {
        sql: (sql) => client.query(sql),
        createTable: (name, cols) => {
          const colDefs = Object.entries(cols).map(([col, def]) => {
            if (typeof def === 'string') return `${col} ${def}`;
            let str = `${col} ${def.type}`;
            if (def.primaryKey) str += ' PRIMARY KEY';
            if (def.notNull) str += ' NOT NULL';
            if (def.unique) str += ' UNIQUE';
            if (def.default) str += ` DEFAULT ${def.default}`;
            if (def.references) str += ` REFERENCES ${def.references}`;
            if (def.onDelete) str += ` ON DELETE ${def.onDelete}`;
            return str;
          }).join(',\n  ');
          return client.query(`CREATE TABLE IF NOT EXISTS ${name} (\n  ${colDefs}\n)`);
        },
        dropTable: (name, opts) => client.query(`DROP TABLE IF EXISTS ${name} ${opts?.cascade ? 'CASCADE' : ''}`),
        createIndex: (table, cols) => {
          const colArr = Array.isArray(cols) ? cols : [cols];
          const idxName = `${table}_${colArr.join('_')}_idx`;
          return client.query(`CREATE INDEX IF NOT EXISTS ${idxName} ON ${table} (${colArr.join(', ')})`);
        },
        addConstraint: (table, name, def) => client.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} ${def}`),
        createFunction: (name, args, opts, body) => client.query(`
          CREATE OR REPLACE FUNCTION ${name}()
          RETURNS ${opts.returns} AS $$${body}$$ LANGUAGE ${opts.language}
        `),
        createTrigger: (table, name, opts) => client.query(`
          CREATE OR REPLACE TRIGGER ${name}
          ${opts.when} ${opts.operation} ON ${table}
          FOR EACH ${opts.level} EXECUTE FUNCTION ${opts.function}()
        `),
        func: (f) => f,
      };

      await client.query('BEGIN');
      try {
        await mod.up(pgm);
        await client.query('INSERT INTO pgmigrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Done: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed: ${file}`, err.message);
        throw err;
      }
    }

    console.log('\n✅ All migrations complete!');
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});