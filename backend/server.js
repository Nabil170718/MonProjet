const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
let server;

// Middleware
app.use(cors());
app.use(express.json());

// Gestion propre de l'arrêt
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Arrêt du serveur...');
  if (server) {
    server.close(() => {
      console.log('Serveur arrêté');
      mongoose.connection.close(false, () => {
        console.log('MongoDB déconnecté');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
}

// Connection à MongoDB
console.log('Tentative de connexion à MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connecté à MongoDB');
  
  // Routes
  const authRoutes = require('./routes/auth');
  const prestatairesRoutes = require('./routes/prestataires');
  const reservationsRoutes = require('./routes/reservations');

  app.use('/api/auth', authRoutes);
  app.use('/api/prestataires', prestatairesRoutes);
  app.use('/api/reservations', reservationsRoutes);

  // Route de base
  app.get('/', (req, res) => {
    res.send('API Services à domicile');
  });

  // Gestion des erreurs
  app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  });

  // Port d'écoute
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
})
.catch(err => {
  console.error('Erreur de connexion à MongoDB:', err);
  process.exit(1);
}); 