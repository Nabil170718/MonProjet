const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const Prestataire = require('../models/Prestataire');

// Route d'inscription client
router.post('/register/client', async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;
    
    // Ajout de logs pour déboguer
    console.log('Données reçues:', { nom, prenom, email, password });

    if (!password) {
      return res.status(400).json({ message: 'Le mot de passe est requis' });
    }

    // Vérifier si l'email existe déjà
    let client = await Client.findOne({ email });
    if (client) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Crypter le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer le nouveau client
    client = new Client({
      nom,
      prenom,
      email,
      password: hashedPassword
    });

    await client.save();

    // Créer le token JWT
    const token = jwt.sign(
      { id: client._id, type: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Erreur complète:', err);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: err.message,
      details: err.stack 
    });
  }
});

// Route d'inscription prestataire
router.post('/register/prestataire', async (req, res) => {
  try {
    const { nom, prenom, email, password, typeService, tarifHoraire } = req.body;

    let prestataire = await Prestataire.findOne({ email });
    if (prestataire) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    prestataire = new Prestataire({
      nom,
      prenom,
      email,
      password: hashedPassword,
      typeService,
      tarifHoraire
    });

    await prestataire.save();

    const token = jwt.sign(
      { id: prestataire._id, type: 'prestataire' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password, type } = req.body;

    // Chercher l'utilisateur selon son type
    let user;
    if (type === 'client') {
      user = await Client.findOne({ email });
    } else {
      user = await Prestataire.findOne({ email });
    }

    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Créer le token
    const token = jwt.sign(
      { id: user._id, type: type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 