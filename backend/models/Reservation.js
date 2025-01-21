const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  prestataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestataire',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  duree: {
    type: Number, // en heures
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmee', 'terminee', 'annulee'],
    default: 'en_attente'
  },
  adresse: {
    rue: String,
    ville: String,
    codePostal: String
  },
  prix: {
    type: Number,
    required: true
  },
  commentaire: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema); 