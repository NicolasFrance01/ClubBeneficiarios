import { getDb } from './db.js';

export default async function handler(req, res) {
  const pool = getDb();

  try {
    if (req.method === 'GET') {
      const users = await pool.query('SELECT * FROM users ORDER BY id ASC');
      const beneficiaries = await pool.query('SELECT * FROM beneficiaries ORDER BY id ASC');
      const transactions = await pool.query('SELECT * FROM transactions ORDER BY date DESC');

      res.status(200).json({
        users: users.rows,
        beneficiaries: beneficiaries.rows,
        transactions: transactions.rows
      });
    } else if (req.method === 'POST') {
      const { action, payload } = req.body;

      if (action === 'ADD_USER') {
        const { name, role, email, password, needsPasswordChange } = payload;
        const result = await pool.query(
          'INSERT INTO users (name, role, email, password, needs_password_change) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [name, role, email, password, needsPasswordChange]
        );
        res.status(200).json(result.rows[0]);
      } 
      else if (action === 'UPDATE_USER') {
        const { id, ...fields } = payload;
        const updates = Object.keys(fields).map((k, i) => `${k === 'needsPasswordChange' ? 'needs_password_change' : k} = $${i + 2}`).join(', ');
        const values = Object.values(fields);
        const result = await pool.query(`UPDATE users SET ${updates} WHERE id = $1 RETURNING *`, [id, ...values]);
        res.status(200).json(result.rows[0]);
      }
      else if (action === 'DELETE_USER') {
        await pool.query('DELETE FROM users WHERE id = $1', [payload.id]);
        res.status(200).json({ success: true });
      }
      else if (action === 'ADD_BENEFICIARY') {
        const { name, doc, email, phone, plan, paymentMethod, status, referredBy, foto_frente, foto_dorso, date } = payload;
        const result = await pool.query(
          'INSERT INTO beneficiaries (name, doc, email, phone, plan, payment_method, status, referred_by, foto_frente, foto_dorso, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
          [name, doc, email, phone, plan, paymentMethod, status, referredBy, foto_frente, foto_dorso, date]
        );
        res.status(200).json(result.rows[0]);
      }
      else if (action === 'UPDATE_BENEFICIARY') {
        const { id, ...fields } = payload;
        
        // Map JS camelCase fields to DB snake_case
        const dbFields = {};
        for(let key in fields) {
          if(key === 'paymentMethod') dbFields['payment_method'] = fields[key];
          else if(key === 'referredBy') dbFields['referred_by'] = fields[key];
          else dbFields[key] = fields[key];
        }

        const updates = Object.keys(dbFields).map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = Object.values(dbFields);
        const result = await pool.query(`UPDATE beneficiaries SET ${updates} WHERE id = $1 RETURNING *`, [id, ...values]);
        res.status(200).json(result.rows[0]);
      }
      else if (action === 'DELETE_BENEFICIARY') {
        await pool.query('DELETE FROM beneficiaries WHERE id = $1', [payload.id]);
        res.status(200).json({ success: true });
      }
      else if (action === 'ADD_TRANSACTION') {
        const { amount, type, method, beneficiary, details, ref, comprobante_url } = payload;
        const result = await pool.query(
          'INSERT INTO transactions (amount, type, method, beneficiary, details, ref, comprobante_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [amount, type, method, beneficiary, details, ref, comprobante_url]
        );
        res.status(200).json(result.rows[0]);
      }
      else {
        res.status(400).json({ error: 'Unknown action' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: error.message });
  }
}
