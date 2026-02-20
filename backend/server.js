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
const notificationRoutes = require('./routes/notifications');
const dailyreportsRoutes = require('./routes/dailyreports');
const sprintsRoutes = require('./routes/sprints');
const equipeRoutes = require('./routes/equipe');
const importIcsRoutes = require('./routes/importics');
const featureflagsRoutes = require('./routes/featureflags');
const activitylogsRoutes = require('./routes/activitylogs');
const searchRoutes = require('./routes/search');
const { router: authRoutes } = require('./routes/auth');

// Import services
const notificationService = require('./services/NotificationService');

// Use routes
app.use('/api/cabinets', cabinetRoutes);
app.use('/api/praticiens', praticienRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/contrats', contratRoutes);
app.use('/api/rendez-vous', rendezvousRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dailyreports', dailyreportsRoutes);
app.use('/api/sprints', sprintsRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/import-ics', importIcsRoutes);
app.use('/api/featureflags', featureflagsRoutes);
app.use('/api/activity-logs', activitylogsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
  
  // Démarrer le service de notifications
  notificationService.start();
});
