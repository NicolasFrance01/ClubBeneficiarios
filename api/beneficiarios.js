import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  const sql = neon(process.env.DATABASE_URL);

  if (request.method === 'GET') {
    try {
      const beneficiarios = await sql`SELECT * FROM beneficiarios ORDER BY fecha_ingreso DESC`;
      return response.status(200).json(beneficiarios);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const { nombre, documento, email, telefono, plan, metodo_pago, referente, foto_frente, foto_dorso } = request.body;
      
      const newBeneficiario = await sql`
        INSERT INTO beneficiarios (nombre, documento, email, telefono, plan, metodo_pago, referente, foto_frente, foto_dorso)
        VALUES (${nombre}, ${documento}, ${email}, ${telefono}, ${plan}, ${metodo_pago}, ${referente}, ${foto_frente}, ${foto_dorso})
        RETURNING *;
      `;
      
      return response.status(201).json(newBeneficiario[0]);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ message: 'Method Not Allowed' });
}
