const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const cabinetRoutes = require('./routes/cabinets');
const praticienRoutes = require('./routes/praticiens');
const installationRoutes = require('./routes/installations');
const contratRoutes = require('./routes/contrats');

// Use routes
app.use('/api/cabinets', cabinetRoutes);
app.use('/api/praticiens', praticienRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/contrats', contratRoutes);

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
