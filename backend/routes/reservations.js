const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Prestataire = require('../models/Prestataire');
const auth = require('../middleware/auth');

// Créer une nouvelle réservation
router.post('/', auth, async (req, res) => {
  try {
    const { prestataireId, date, duree, adresse } = req.body;

    // Vérifie que l'utilisateur est un client
    if (req.user.type !== 'client') {
      return res.status(403).json({ message: 'Seuls les clients peuvent faire des réservations' });
    }

    // Récupère le prestataire pour calculer le prix
    const prestataire = await Prestataire.findById(prestataireId);
    if (!prestataire) {
      return res.status(404).json({ message: 'Prestataire non trouvé' });
    }

    // Calcule le prix total
    const prix = prestataire.tarifHoraire * duree;

    // Crée la réservation
    const reservation = new Reservation({
      client: req.user.id,
      prestataire: prestataireId,
      date: new Date(date),
      duree,
      adresse,
      prix
    });

    await reservation.save();

    res.status(201).json(reservation);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les réservations d'un utilisateur
router.get('/mes-reservations', auth, async (req, res) => {
  try {
    let reservations;
    
    if (req.user.type === 'client') {
      reservations = await Reservation.find({ client: req.user.id })
        .populate('prestataire', 'nom prenom email typeService');
    } else {
      reservations = await Reservation.find({ prestataire: req.user.id })
        .populate('client', 'nom prenom email');
    }

    res.json(reservations);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une réservation
router.put('/:id/statut', auth, async (req, res) => {
  try {
    const { statut } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifie les droits
    if (req.user.type === 'prestataire' && reservation.prestataire.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    if (req.user.type === 'client' && reservation.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    reservation.statut = statut;
    await reservation.save();

    res.json(reservation);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 