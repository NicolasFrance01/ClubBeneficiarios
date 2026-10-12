import { getDb } from './db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  const pool = getDb();

  try {
    if (req.method === 'GET') {
      const users = await pool.query('SELECT id, name, role, email, needs_password_change FROM users ORDER BY id ASC');
      const beneficiaries = await pool.query('SELECT * FROM beneficiaries ORDER BY id ASC');
      const transactions = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
      const referents = await pool.query('SELECT * FROM referents ORDER BY id ASC');
      const plans = await pool.query('SELECT * FROM plans ORDER BY base_price ASC');

      res.status(200).json({
        users: users.rows,
        beneficiaries: beneficiaries.rows,
        transactions: transactions.rows,
        referents: referents.rows,
        plans: plans.rows
      });
    } else if (req.method === 'POST') {
      const { action, payload } = req.body;

      if (action === 'ADD_USER') {
        const { name, role, email, password, needsPasswordChange } = payload;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
          'INSERT INTO users (name, role, email, password, needs_password_change) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, role, email, needs_password_change',
          [name, role, email, hashedPassword, needsPasswordChange]
        );
        res.status(200).json(result.rows[0]);
      } 
      else if (action === 'UPDATE_USER') {
        const { id, password, ...fields } = payload;
        
        // Map fields and handle optional password
        const dbFields = {};
        for (let key in fields) {
          if (key === 'needsPasswordChange') dbFields['needs_password_change'] = fields[key];
          else dbFields[key] = fields[key];
        }

        let updates = [];
        let values = [id];
        let paramIndex = 2;

        for (let key in dbFields) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(dbFields[key]);
          paramIndex++;
        }

        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updates.push(`password = $${paramIndex}`);
          values.push(hashedPassword);
        }

        if (updates.length > 0) {
          const result = await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, role, email, needs_password_change`, values);
          res.status(200).json(result.rows[0]);
        } else {
          res.status(200).json({ success: true, message: 'No fields to update' });
        }
      }
      else if (action === 'DELETE_USER') {
        await pool.query('DELETE FROM users WHERE id = $1', [payload.id]);
        res.status(200).json({ success: true });
      }
      else if (action === 'ADD_BENEFICIARY') {
        const { name, doc, email, phone, plan, paymentMethod, status, referredBy, referente, foto_frente, foto_dorso, date } = payload;
        const finalReferred = (referredBy || referente || '').trim() || null;
        const result = await pool.query(
          'INSERT INTO beneficiaries (name, doc, email, phone, plan, payment_method, status, referred_by, foto_frente, foto_dorso, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
          [name, doc, email, phone, plan, paymentMethod, status, finalReferred, foto_frente, foto_dorso, date]
        );
        res.status(200).json(result.rows[0]);
      }
      else if (action === 'UPDATE_BENEFICIARY') {
        const { id, ...fields } = payload;
        
        const allowedColumns = {
          name: 'name',
          doc: 'doc',
          email: 'email',
          phone: 'phone',
          plan: 'plan',
          paymentMethod: 'payment_method',
          payment_method: 'payment_method',
          status: 'status',
          referredBy: 'referred_by',
          referente: 'referred_by',
          referred_by: 'referred_by',
          foto_frente: 'foto_frente',
          foto_dorso: 'foto_dorso',
          date: 'date'
        };

        const dbFields = {};
        for(let key in fields) {
          if (allowedColumns[key]) {
            const col = allowedColumns[key];
            if (col === 'referred_by') {
              dbFields[col] = (fields[key] || '').trim() || null;
            } else {
              dbFields[col] = fields[key];
            }
          }
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
      else if (action === 'ADD_REFERENT') {
        const { name, phone, email, cbuAlias, commissionType, commissionMonths, commissionAmount, status } = payload;
        const result = await pool.query(
          'INSERT INTO referents (name, phone, email, cbu_alias, commission_type, commission_months, commission_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [name, phone, email, cbuAlias, commissionType || 'ingreso', commissionMonths || 1, commissionAmount || 2500, status || 'activo']
        );
        res.status(200).json(result.rows[0]);
      }
      else if (action === 'UPDATE_REFERENT') {
        const { id, ...fields } = payload;
        const dbFields = {};
        for(let key in fields) {
          if(key === 'commissionType') dbFields['commission_type'] = fields[key];
          else if(key === 'commissionMonths') dbFields['commission_months'] = fields[key];
          else if(key === 'commissionAmount') dbFields['commission_amount'] = fields[key];
          else if(key === 'cbuAlias') dbFields['cbu_alias'] = fields[key];
          else dbFields[key] = fields[key];
        }

        const updates = Object.keys(dbFields).map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = Object.values(dbFields);
        const result = await pool.query(`UPDATE referents SET ${updates} WHERE id = $1 RETURNING *`, [id, ...values]);
        res.status(200).json(result.rows[0]);
      }
      else if (action === 'DELETE_REFERENT') {
        await pool.query('DELETE FROM referents WHERE id = $1', [payload.id]);
        res.status(200).json({ success: true });
      }
      else if (action === 'UPDATE_PLAN') {
        const { id, commission, basePrice } = payload;
        let query = 'UPDATE plans SET commission = $2';
        let params = [id, Number(commission)];
        if (basePrice !== undefined) {
          query += ', base_price = $3';
          params.push(Number(basePrice));
        }
        query += ' WHERE id = $1 RETURNING *';
        const result = await pool.query(query, params);
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
