const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Générer un token JWT
const generateJWTtoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "5d" });
};

// Inscription d'un utilisateur
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Vérification des champs obligatoires
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory");
  }

  // Vérification si l'utilisateur existe déjà
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Hashage du mot de passe
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Création de l'utilisateur
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateJWTtoken(user._id),
    });
    console.log(`User ${user.name} registered`);
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Connexion d'un utilisateur
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Recherche de l'utilisateur par email
  const user = await User.findOne({ email });

  // Validation du mot de passe
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateJWTtoken(user._id),
    });
    console.log(`User ${user.name} logged in`);
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// Récupération des informations de l'utilisateur connecté
const getCurrentUser = asyncHandler(async (req, res) => {
  const { _id, name, email } = req.user; // `req.user` est ajouté par le middleware d'authentification
  res.status(200).json({ id: _id, name, email });
});

module.exports = { registerUser, loginUser, getCurrentUser };
