const express = require('express');
const router = express.Router();
const Prestataire = require('../models/Prestataire');
const auth = require('../middleware/auth');

// Route pour obtenir tous les prestataires
router.get('/', async (req, res) => {
  try {
    // Recherche tous les prestataires dans la base de données
    const prestataires = await Prestataire.find()
      // Exclut le mot de passe des résultats
      .select('-password');
    
    res.json(prestataires);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les prestataires par type de service
router.get('/service/:type', async (req, res) => {
  try {
    const { type } = req.params; // Récupère le type depuis l'URL
    
    // Vérifie si le type est valide
    const typesValides = ['menage', 'babysitting', 'cuisine'];
    if (!typesValides.includes(type)) {
      return res.status(400).json({ message: 'Type de service invalide' });
    }

    // Recherche les prestataires du type demandé
    const prestataires = await Prestataire.find({ typeService: type })
      .select('-password');
    
    res.json(prestataires);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir un prestataire spécifique
router.get('/:id', async (req, res) => {
  try {
    const prestataire = await Prestataire.findById(req.params.id)
      .select('-password');
    
    if (!prestataire) {
      return res.status(404).json({ message: 'Prestataire non trouvé' });
    }
    
    res.json(prestataire);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour le profil d'un prestataire
router.put('/profile', auth, async (req, res) => {
  try {
    const { tarifHoraire, description } = req.body;
    
    // Vérifie que l'utilisateur est bien un prestataire
    if (req.user.type !== 'prestataire') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Met à jour le profil
    const prestataire = await Prestataire.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          tarifHoraire: tarifHoraire,
          description: description
        }
      },
      { new: true }
    ).select('-password');

    res.json(prestataire);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour gérer les disponibilités
router.put('/disponibilites', auth, async (req, res) => {
  try {
    const { disponibilites } = req.body;
    
    // Vérifie que l'utilisateur est bien un prestataire
    if (req.user.type !== 'prestataire') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Met à jour les disponibilités
    const prestataire = await Prestataire.findByIdAndUpdate(
      req.user.id,
      {
        $set: { disponibilites: disponibilites }
      },
      { new: true }
    ).select('-password');

    res.json(prestataire);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour rechercher des prestataires avec filtres
router.get('/recherche', async (req, res) => {
  try {
    const { typeService, tarifMax } = req.query;
    
    // Construit le filtre
    let filtre = {};
    
    if (typeService) {
      filtre.typeService = typeService;
    }
    
    if (tarifMax) {
      filtre.tarifHoraire = { $lte: parseInt(tarifMax) };
    }

    // Recherche les prestataires
    const prestataires = await Prestataire.find(filtre)
      .select('-password')
      .sort({ noteGlobale: -1 }); // Trie par note décroissante

    res.json(prestataires);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 