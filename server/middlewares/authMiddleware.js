const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "Accès non autorisé" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId; // Ajouter l'ID de l'utilisateur dans la requête
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token invalide" });
  }
};

module.exports = authMiddleware;
