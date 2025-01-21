const mongoose = require('mongoose');

const prestataireSchema = new mongoose.Schema({
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
  typeService: {
    type: String,
    enum: ['menage', 'babysitting', 'cuisine'],
    required: true
  },
  tarifHoraire: {
    type: Number,
    required: true
  },
  description: String,
  disponibilites: [String],
  evaluations: [{
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    note: Number,
    commentaire: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  noteGlobale: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prestataire', prestataireSchema); 