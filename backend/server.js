const cabinetsRouter = require('./routes/cabinets');
const praticiensRouter = require('./routes/praticiens');
const installationsRouter = require('./routes/installations');
const contratsRouter = require('./routes/contrats');

app.use('/api/cabinets', cabinetsRouter);
app.use('/api/praticiens', praticiensRouter);
app.use('/api/installations', installationsRouter);
app.use('/api/contrats', contratsRouter);
