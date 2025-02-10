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
// Route pour modifier un avis
router.put('/:avisId', auth, async (req, res) => {
  try {
    // 1. Vérifier que l'avis existe
    const avis = await Avis.findById(req.params.avisId);
    if (!avis) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }

    // 2. Vérifier que c'est bien le client qui a créé l'avis
    if (avis.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // 3. Mettre à jour l'avis
    avis.note = req.body.note || avis.note;
    avis.commentaire = req.body.commentaire || avis.commentaire;
    
    await avis.save();

    // 4. Recalculer la moyenne du prestataire
    const nouvelleMoyenne = await calculerMoyenneAvis(avis.prestataire);
    await Prestataire.findByIdAndUpdate(
      avis.prestataire,
      { noteGlobale: nouvelleMoyenne }
    );

    res.json(avis);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// Route pour supprimer un avis
router.delete('/:avisId', auth, async (req, res) => {
  try {
    // 1. Vérifier que l'avis existe
    const avis = await Avis.findById(req.params.avisId);
    if (!avis) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }

    // 2. Vérifier que c'est bien le client qui a créé l'avis
    if (avis.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // 3. Sauvegarder l'ID du prestataire avant la suppression
    const prestataireId = avis.prestataire;

    // 4. Supprimer l'avis
    await Avis.findByIdAndDelete(req.params.avisId);

    // 5. Recalculer la moyenne du prestataire
    const nouvelleMoyenne = await calculerMoyenneAvis(prestataireId);
    await Prestataire.findByIdAndUpdate(
      prestataireId,
      { noteGlobale: nouvelleMoyenne }
    );

    res.json({ message: 'Avis supprimé avec succès' });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// Route pour rechercher des avis avec filtres
router.get('/recherche', async (req, res) => {
  try {
    const { 
      prestataireId,  // ID du prestataire
      noteMin,        // Note minimum (1-5)
      noteMax,        // Note maximum (1-5)
      dateDebut,      // Date de début pour filtrer
      dateFin,        // Date de fin pour filtrer
      tri,           // 'date' ou 'note'
      ordre          // 'asc' ou 'desc'
    } = req.query;

    // Construire le filtre
    let filtre = {};

    // Filtre par prestataire
    if (prestataireId) {
      filtre.prestataire = prestataireId;
    }

    // Filtre par note
    if (noteMin || noteMax) {
      filtre.note = {};
      if (noteMin) filtre.note.$gte = parseInt(noteMin);
      if (noteMax) filtre.note.$lte = parseInt(noteMax);
    }

    // Filtre par date
    if (dateDebut || dateFin) {
      filtre.dateService = {};
      if (dateDebut) filtre.dateService.$gte = new Date(dateDebut);
      if (dateFin) filtre.dateService.$lte = new Date(dateFin);
    }

    // Configurer le tri
    let options = {};
    if (tri) {
      options.sort = {};
      options.sort[tri === 'date' ? 'dateService' : 'note'] = ordre === 'asc' ? 1 : -1;
    }

    // Rechercher les avis
    const avis = await Avis.find(filtre, null, options)
      .populate('client', 'nom prenom')
      .populate('prestataire', 'nom prenom typeService');

    res.json({
      total: avis.length,
      avis: avis
    });

  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// Importer le modèle Reservation en haut du fichier
const Reservation = require('../models/Reservation');

// Modifier la route POST pour ajouter la vérification
router.post('/', auth, async (req, res) => {
  try {
    // Vérifie que c'est bien un client
    if (req.user.type !== 'client') {
      return res.status(403).json({ 
        message: 'Seuls les clients peuvent laisser des avis' 
      });
    }

    // Vérifie si le client a une réservation terminée avec ce prestataire
    const reservation = await Reservation.findOne({
      client: req.user.id,
      prestataire: req.body.prestataireId,
      statut: 'terminee'
    });

    if (!reservation) {
      return res.status(403).json({ 
        message: 'Vous devez avoir utilisé le service avant de laisser un avis' 
      });
    }

    // Vérifie si le client a déjà laissé un avis pour cette réservation
    const avisExistant = await Avis.findOne({
      client: req.user.id,
      prestataire: req.body.prestataireId,
      dateService: reservation.date
    });

    if (avisExistant) {
      return res.status(400).json({ 
        message: 'Vous avez déjà laissé un avis pour ce service' 
      });
    }

    
module.exports = router; 