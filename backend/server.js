const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
// Augmenter la limite pour les images base64 (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir les fichiers statiques (PDF)
const uploadsPath = path.resolve(__dirname, 'services/pdf/uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Import routes
const cabinetRoutes = require('./routes/cabinets');
const praticienRoutes = require('./routes/praticiens');
const installationRoutes = require('./routes/installations');
const contratRoutes = require('./routes/contrats');
const rendezvousRoutes = require('./routes/rendezvous');
const todoRoutes = require('./routes/todos');
const knowledgeRoutes = require('./routes/knowledge');
const { router: authRoutes } = require('./routes/auth');

// Use routes
app.use('/api/cabinets', cabinetRoutes);
app.use('/api/praticiens', praticienRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/contrats', contratRoutes);
app.use('/api/rendez-vous', rendezvousRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/auth', authRoutes);

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
