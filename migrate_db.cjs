const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log("Creando tablas en NeonDB...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        needs_password_change BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabla 'users' creada o ya existe.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        doc VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(100),
        plan VARCHAR(100) NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'activo',
        referred_by VARCHAR(255),
        foto_frente TEXT,
        foto_dorso TEXT,
        date DATE DEFAULT CURRENT_DATE
      );
    `);
    console.log("Tabla 'beneficiaries' creada o ya existe.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        amount DECIMAL(10,2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        method VARCHAR(50) NOT NULL,
        beneficiary VARCHAR(255) NOT NULL,
        details TEXT,
        ref VARCHAR(100),
        comprobante_url TEXT
      );
    `);
    console.log("Tabla 'transactions' creada o ya existe.");

    // Insert fallback admin user if it doesn't exist
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'nfrance@atlascore.com'");
    if (adminCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (name, role, email, password, needs_password_change) 
        VALUES ('Nicolas France', 'Fundador', 'nfrance@atlascore.com', 'admin', false)
      `);
      console.log("Usuario admin creado en BD.");
    }

    console.log("Migración completada exitosamente.");
  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await pool.end();
  }
}

migrate();
