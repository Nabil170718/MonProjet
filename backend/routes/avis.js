const express = require('express');
const router = express.Router();
const Avis = require('../models/Avis');
const Prestataire = require('../models/Prestataire');
const auth = require('../middleware/auth');

// Fonction pour calculer la moyenne des avis
async function calculerMoyenneAvis(prestataireId) {
    const avis = await Avis.find({ prestataire: prestataireId });
    if (avis.length === 0) return 0;
    const somme = avis.reduce((total, avis) => total + avis.note, 0);
    return somme / avis.length;
}

// Route pour créer un avis
router.post('/', auth, async (req, res) => {
  try {
    // Vérifie que c'est bien un client qui crée l'avis
    if (req.user.type !== 'client') {
      return res.status(403).json({ 
        message: 'Seuls les clients peuvent laisser des avis' 
      });
    }

    // Crée le nouvel avis
    const nouvelAvis = new Avis({
      client: req.user.id,           // ID du client connecté
      prestataire: req.body.prestataireId,
      note: req.body.note,
      commentaire: req.body.commentaire,
      dateService: new Date(req.body.dateService)
    });

    // Sauvegarde l'avis
    await nouvelAvis.save();

    // Calcule et met à jour la note moyenne du prestataire
    const nouvelleMoyenne = await calculerMoyenneAvis(req.body.prestataireId);
    await Prestataire.findByIdAndUpdate(
      req.body.prestataireId,
      { noteGlobale: nouvelleMoyenne }
    );

    res.status(201).json(nouvelAvis);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour voir tous les avis d'un prestataire
router.get('/prestataire/:prestataireId', async (req, res) => {
  try {
    // Récupère l'ID du prestataire depuis l'URL
    const prestataireId = req.params.prestataireId;

    // Recherche tous les avis pour ce prestataire
    const avis = await Avis.find({ prestataire: prestataireId })
      // Inclut les informations du client (sauf le mot de passe)
      .populate('client', 'nom prenom')
      // Trie par date décroissante (plus récent d'abord)
      .sort({ createdAt: -1 });

    // Calcule la note moyenne
    const notes = avis.map(a => a.note);
    const moyenne = notes.length > 0 
      ? notes.reduce((a, b) => a + b) / notes.length 
      : 0;

    res.json({
      avis: avis,
      nombreAvis: avis.length,
      noteMoyenne: moyenne.toFixed(1)
    });

  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 