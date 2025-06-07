const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

app.use(express.json()); // for parsing application/json
app.use('/api', authRoutes); // now POST /api/login works
app.use(cors());
