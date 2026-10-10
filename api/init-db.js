import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // Create Plans Table (To track commission configurations if needed, though they are mostly static)
    await sql`
      CREATE TABLE IF NOT EXISTS configuracion (
        id SERIAL PRIMARY KEY,
        clave VARCHAR(50) UNIQUE NOT NULL,
        valor TEXT NOT NULL
      );
    `;

    // Initialize default configuration if it doesn't exist
    await sql`
      INSERT INTO configuracion (clave, valor)
      VALUES ('comision_atlascore', '5000')
      ON CONFLICT (clave) DO NOTHING;
    `;
    
    await sql`
      INSERT INTO configuracion (clave, valor)
      VALUES ('iva', '0.21')
      ON CONFLICT (clave) DO NOTHING;
    `;

    // Create Beneficiarios Table
    await sql`
      CREATE TABLE IF NOT EXISTS beneficiarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        documento VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(50),
        plan VARCHAR(50) NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL,
        referente VARCHAR(255),
        foto_frente TEXT,
        foto_dorso TEXT,
        estado VARCHAR(50) DEFAULT 'activo',
        fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Transacciones Table
    await sql`
      CREATE TABLE IF NOT EXISTS transacciones (
        id SERIAL PRIMARY KEY,
        beneficiario_id INTEGER REFERENCES beneficiarios(id),
        tipo VARCHAR(50) NOT NULL, -- 'ingreso' (pago de cuota) o 'egreso' (liquidación a fitness group)
        metodo VARCHAR(50) NOT NULL, -- 'efectivo', 'transferencia'
        monto DECIMAL(10, 2) NOT NULL,
        detalle TEXT,
        referencia VARCHAR(100),
        comprobante_url TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Usuarios (Fundadores) Table
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        rol VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return response.status(200).json({ message: 'Tablas inicializadas correctamente.' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
