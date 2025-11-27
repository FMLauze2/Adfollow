const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

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

// Use routes
app.use('/api/cabinets', cabinetRoutes);
app.use('/api/praticiens', praticienRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/contrats', contratRoutes);
app.use('/api/rendez-vous', rendezvousRoutes);

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
