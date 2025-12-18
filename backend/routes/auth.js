const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-me';

if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET manquant : utilisation d\'un secret de secours (à remplacer en prod)');
}
const JWT_EXPIRES_IN = '24h';

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username et password requis' });
    }

    // Récupérer l'utilisateur
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Mettre à jour last_login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id_user = $1',
      [user.id_user]
    );

    // Générer le token JWT
    const token = jwt.sign(
      {
        id_user: user.id_user,
        username: user.username,
        role: user.role,
        auth_type: user.auth_type
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Retourner les infos utilisateur (sans le password_hash)
    const { password_hash, ...userInfo } = user;

    res.json({
      success: true,
      token,
      user: userInfo
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier le token (middleware à utiliser pour protéger les routes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Route protégée pour obtenir les infos utilisateur courant
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id_user, username, email, role, nom, prenom, auth_type, last_login FROM users WHERE id_user = $1',
      [req.user.id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un utilisateur (admin uniquement)
router.post('/users', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const { username, password, email, role, nom, prenom, permissions } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username et password requis' });
    }

    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (username, password_hash, email, role, nom, prenom, auth_type, permissions) 
       VALUES ($1, $2, $3, $4, $5, $6, 'local', $7) 
       RETURNING id_user, username, email, role, nom, prenom, auth_type, permissions, is_active`,
      [username, password_hash, email || null, role || 'user', nom || null, prenom || null, permissions || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Duplicate username
      return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà' });
    }
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le mot de passe
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    // Récupérer l'utilisateur
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id_user = $1',
      [req.user.id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const validPassword = await bcrypt.compare(oldPassword, result.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id_user = $2',
      [newPasswordHash, req.user.id_user]
    );

    res.json({ success: true, message: 'Mot de passe modifié' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lister tous les utilisateurs (admin uniquement)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const result = await db.query(
      'SELECT id_user, username, email, role, nom, prenom, auth_type, permissions, is_active, last_login, date_creation FROM users ORDER BY username'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un utilisateur (admin uniquement)
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const { id } = req.params;
    const { password, email, role, nom, prenom, permissions } = req.body;

    // Construire la requête de mise à jour
    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(email || null);
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (nom !== undefined) {
      updateFields.push(`nom = $${paramIndex++}`);
      values.push(nom || null);
    }
    if (prenom !== undefined) {
      updateFields.push(`prenom = $${paramIndex++}`);
      values.push(prenom || null);
    }
    if (permissions !== undefined) {
      updateFields.push(`permissions = $${paramIndex++}`);
      values.push(permissions);
    }

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${paramIndex++}`);
      values.push(password_hash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE users SET ${updateFields.join(', ')} 
       WHERE id_user = $${paramIndex} 
       RETURNING id_user, username, email, role, nom, prenom, auth_type, permissions, is_active, last_login, date_creation`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Activer/désactiver un utilisateur (admin uniquement)
router.post('/users/:id/toggle-active', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const { id } = req.params;

    const result = await db.query(
      `UPDATE users SET is_active = NOT is_active 
       WHERE id_user = $1 
       RETURNING id_user, username, email, role, nom, prenom, auth_type, permissions, is_active, last_login, date_creation`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur toggle active utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur (admin uniquement)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const { id } = req.params;

    // Vérifier qu'on ne supprime pas le compte admin principal
    const userCheck = await db.query(
      'SELECT username FROM users WHERE id_user = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (userCheck.rows[0].username === 'admin') {
      return res.status(403).json({ error: 'Impossible de supprimer le compte admin principal' });
    }

    await db.query('DELETE FROM users WHERE id_user = $1', [id]);

    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = { router, authenticateToken };
