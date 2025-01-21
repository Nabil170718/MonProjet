const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  adresse: {
    rue: String,
    ville: String,
    codePostal: String
  },
  telephone: String,
  reservations: [{
    prestataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prestataire'
    },
    date: Date,
    duree: Number,
    statut: {
      type: String,
      enum: ['en_attente', 'confirmee', 'terminee', 'annulee'],
      default: 'en_attente'
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Client', clientSchema); 