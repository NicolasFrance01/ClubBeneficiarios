import { getDb } from './db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const pool = getDb();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = result.rows[0];
    
    // Check if the password is valid
    // For legacy plain text passwords, we handle a fallback just in case
    // But ideally all should be bcrypt.
    let isValid = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain text compare
      isValid = (password === user.password);
      // Auto-migrate to hash in the background? We won't do it here to keep it simple,
      // but they can change password to force a re-hash.
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Return user without password
    const { password: _, needs_password_change, ...safeUser } = user;
    
    res.status(200).json({
      success: true,
      user: {
        ...safeUser,
        needsPasswordChange: needs_password_change
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
