const multer = require("multer");
const path = require("path");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");

// Configuration de Multer pour gérer l'upload des images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads", "profilePictures");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

// Fonction pour générer un token JWT
const generateJWTtoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "5d" });
};

// Inscription d'un utilisateur
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Tous les champs sont obligatoires");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("L'utilisateur existe déjà");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  let profilePicture = null;
  if (req.file) {
    profilePicture = path.join("uploads", "profilePictures", req.file.filename);
  }

  try {
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profilePicture,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        token: generateJWTtoken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Données utilisateur invalides");
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// Autres fonctions (connexion, récupération des infos, etc.)
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(400);
    throw new Error("Email ou mot de passe invalides");
  }

  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    token: generateJWTtoken(user._id),
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const { _id, name, email, profilePicture } = req.user;

  res.status(200).json({
    id: _id,
    name,
    email,
    profilePicture,
  });
});

const getProfilePicture = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (user && user.profilePicture) {
    const imagePath = path.join(__dirname, "..", user.profilePicture);
    res.sendFile(imagePath, (err) => {
      if (err) {
        res.status(500).json({ message: "Erreur lors de l'envoi de l'image" });
      }
    });
  } else {
    res.status(404).json({ message: "Image non trouvée" });
  }
});

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getProfilePicture,
  upload,
};
