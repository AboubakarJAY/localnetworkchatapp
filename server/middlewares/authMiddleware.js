const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Assure-toi que ce modèle est correctement importé

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Vérifier si le token est dans l'en-tête Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extraire le token
      token = req.headers.authorization.split(" ")[1];

      // Décoder le token et récupérer l'ID utilisateur
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer les informations utilisateur sans le mot de passe
      req.user = await User.findById(decoded.id).select("-password");

      // Si l'utilisateur n'est pas trouvé
      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

module.exports = { protect };
