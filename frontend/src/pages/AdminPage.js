import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' ou 'features'
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'technicien',
    nom: '',
    prenom: '',
    permissions: {
      contrats: true,
      installations: true,
      calendrier: true,
      historique: true,
      stats: true,
      knowledge: true,
      todos: true,
      generate_contrat: true
    }
  });

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    fetchUsers();
    fetchFeatureFlags();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      alert('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/featureflags');
      setFeatureFlags(response.data || []);
    } catch (error) {
      console.error('Erreur chargement feature flags:', error);
    }
  };

  const toggleFeatureFlag = async (flagName, currentEnabled) => {
    try {
      await axios.put(`http://localhost:4000/api/featureflags/${flagName}`, {
        enabled: !currentEnabled
      });
      fetchFeatureFlags();
    } catch (error) {
      console.error('Erreur mise à jour feature flag:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        permissions: JSON.stringify(formData.permissions)
      };

      if (editingUser) {
        await axios.put(
          `http://localhost:4000/api/auth/users/${editingUser.id_user}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Utilisateur modifié !');
      } else {
        await axios.post(
          'http://localhost:4000/api/auth/users',
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Utilisateur créé !');
      }

      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Erreur sauvegarde utilisateur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (user) => {
    let permissions = {
      contrats: true,
      installations: true,
      calendrier: true,
      historique: true,
      stats: true,
      knowledge: true,
      todos: true,
      generate_contrat: true
    };

    try {
      if (user.permissions) {
        permissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      }
    } catch (e) {
      console.error('Erreur parsing permissions:', e);
    }

    setFormData({
      username: user.username,
      password: '',
      email: user.email || '',
      role: user.role || 'technicien',
      nom: user.nom || '',
      prenom: user.prenom || '',
      permissions
    });
    setEditingUser(user);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (userId, isActive) => {
    if (!window.confirm(`${isActive ? 'Désactiver' : 'Activer'} cet utilisateur ?`)) return;

    try {
      await axios.post(
        `http://localhost:4000/api/auth/users/${userId}/toggle-active`,
        { is_active: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      console.error('Erreur toggle active:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Supprimer définitivement cet utilisateur ?')) return;

    try {
      await axios.delete(
        `http://localhost:4000/api/auth/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      role: 'technicien',
      nom: '',
      prenom: '',
      permissions: {
        contrats: true,
        installations: true,
        calendrier: true,
        historique: true,
        stats: true,
        knowledge: true,
        todos: true,
        generate_contrat: true
      }
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-100 text-red-800',
      technicien: 'bg-blue-100 text-blue-800',
      support: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return styles[role] || styles.user;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: '👑 Administrateur',
      technicien: '🔧 Technicien',
      support: '💬 Support',
      user: '👤 Utilisateur'
    };
    return labels[role] || role;
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ Administration</h1>

      {/* Onglets */}
      <div className="flex gap-4 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-semibold ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          👥 Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 font-semibold ${activeTab === 'features' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          ⚙️ Fonctionnalités
        </button>
      </div>

      {/* TAB: Utilisateurs */}
      {activeTab === 'users' && (
      <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? '✕ Fermer' : '➕ Nouvel utilisateur'}
        </button>
      </div>

      {/* Formulaire création/édition */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prénom *</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                  className="w-full border px-3 py-2 rounded disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mot de passe {editingUser && '(laisser vide pour ne pas changer)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  className="w-full border px-3 py-2 rounded"
                  placeholder={editingUser ? '••••••••' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="technicien">Technicien</option>
                  <option value="support">Support</option>
                  <option value="admin">Administrateur</option>
                  <option value="user">Utilisateur</option>
                </select>
              </div>
            </div>

            {/* Permissions */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3">🔒 Permissions d'accès</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.contrats}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, contrats: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>📄 Contrats</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.generate_contrat}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, generate_contrat: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>📝 Générer contrat</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.installations}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, installations: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>🔧 Rendez-vous</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.calendrier}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, calendrier: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>📅 Calendrier</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.historique}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, historique: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>📊 Historique</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.stats}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, stats: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>📈 Statistiques</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.knowledge}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, knowledge: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>📚 Base connaissances</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.todos}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, todos: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span>✅ Todo list</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                {editingUser ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-white text-red-600 px-6 py-2 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {loading ? (
        <p className="text-center py-8">Chargement...</p>
      ) : (
        <div className="grid gap-4">
          {users.map(u => (
            <div
              key={u.id_user}
              className={`bg-white rounded-lg shadow p-4 ${!u.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {u.prenom} {u.nom}
                    </h3>
                    <span className={`px-2 py-1 rounded text-sm ${getRoleBadge(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                    {!u.is_active && (
                      <span className="px-2 py-1 rounded text-sm bg-red-100 text-red-800">
                        ⛔ Désactivé
                      </span>
                    )}
                    {u.auth_type === 'ldap' && (
                      <span className="px-2 py-1 rounded text-sm bg-purple-100 text-purple-800">
                        🔐 LDAP
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Username:</strong> {u.username}</p>
                    {u.email && <p><strong>Email:</strong> {u.email}</p>}
                    <p><strong>Dernière connexion:</strong> {u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : 'Jamais'}</p>
                    <p><strong>Créé le:</strong> {new Date(u.date_creation).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleToggleActive(u.id_user, u.is_active)}
                    className={`${u.is_active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1 rounded text-sm`}
                  >
                    {u.is_active ? '⏸️ Désactiver' : '▶️ Activer'}
                  </button>
                  {u.username !== 'admin' && (
                    <button
                      onClick={() => handleDelete(u.id_user)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      )}

      {/* TAB: Fonctionnalités */}
      {activeTab === 'features' && (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestion des fonctionnalités</h2>
        
        {featureFlags.length === 0 ? (
          <p className="text-gray-600">Aucune fonctionnalité configurée</p>
        ) : (
          <div className="grid gap-4">
            {featureFlags.map(flag => (
              <div key={flag.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{flag.name}</h3>
                  {flag.description && (
                    <p className="text-gray-600 text-sm mt-1">{flag.description}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleFeatureFlag(flag.name, flag.enabled)}
                  className={`px-4 py-2 rounded font-semibold text-white ${
                    flag.enabled 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {flag.enabled ? '✓ Activé' : '✗ Désactivé'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

export default AdminPage;

