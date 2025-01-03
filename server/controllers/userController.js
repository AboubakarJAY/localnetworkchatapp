const multer = require("multer");
const path = require("path");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Configurer Multer pour stocker l'image dans la base de données (en mémoire)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Générer un token JWT
const generateJWTtoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "5d" });
};

// Inscription d'un utilisateur avec une image
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

  // Traitement de l'image de profil (si elle existe)
  let profilePicture = null;
  let contentType = null;
  if (req.file) {
    profilePicture = req.file.buffer; // L'image est en mémoire sous forme de buffer
    contentType = req.file.mimetype; // Type MIME de l'image
  }

  // Création de l'utilisateur
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    profilePicture, // Ajout de l'image dans la base de données
    contentType, // Type MIME de l'image
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture
        ? "/profilePicture/" + user._id
        : null, // URL pour l'image
      contentType: user.contentType,
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
  console.log(email, password);

  // Recherche de l'utilisateur par email
  const user = await User.findOne({ email });
  if (!user) {
    // Log si l'utilisateur n'est pas trouvé
    console.log(`User with email ${email} not found.`);
    console.log(req.body);
    res.status(400);
    throw new Error("Invalid email or password");
  }

  // Validation du mot de passe
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture
        ? "/profilePicture/" + user._id
        : null, // URL pour l'image
      contentType: user.contentType,
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
  const { _id, name, email, profilePicture, contentType } = req.user; // `req.user` est ajouté par le middleware d'authentification

  // Renvoi des données utilisateur avec une URL pour l'image de profil si elle existe
  res.status(200).json({
    id: _id,
    name,
    email,
    profilePicture: profilePicture ? "/profilePicture/" + _id : null, // URL pour l'image
    contentType,
  });
});

// Route pour récupérer l'image de profil
const getProfilePicture = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Recherche de l'utilisateur par ID
  const user = await User.findById(userId);

  if (user && user.profilePicture) {
    // Envoi de l'image en tant que fichier avec son type MIME
    res.setHeader("Content-Type", user.contentType);
    res.send(user.profilePicture); // Envoi du buffer d'image
  } else {
    res.status(404);
    throw new Error("Image not found");
  }
});

module.exports = { registerUser, loginUser, getCurrentUser, getProfilePicture };
