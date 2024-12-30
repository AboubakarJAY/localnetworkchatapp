const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// Route d'inscription
router.post(
  "/register",
  [
    // Validation des champs
    body("name").not().isEmpty().withMessage("Le nom ne peut pas être vide"),
    body("email").isEmail().withMessage("Email invalide"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit comporter au moins 6 caractères"),
  ],
  async (req, res) => {
    console.log("Requête reçue pour l'inscription");

    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: "Email déjà utilisé" });
      }

      // Hash du mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Création du nouvel utilisateur
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
      });

      // Sauvegarde de l'utilisateur dans la base de données
      await newUser.save();

      // Création d'un token JWT
      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h", // Le token expire dans 1 heure
      });

      // Réponse avec le token
      res.status(201).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Erreur serveur" });
    }
  }
);
