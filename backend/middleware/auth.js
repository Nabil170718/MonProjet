const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Erreur de token:', err);
    res.status(401).json({ message: 'Token invalide' });
  }
}; 