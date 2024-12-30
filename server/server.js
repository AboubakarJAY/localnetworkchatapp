const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("./models/User"); // Modèle utilisateur

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Fonction pour obtenir l'adresse IP locale
function getLocalIPAddress() {
  const os = require("os");
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "127.0.0.1"; // Adresse par défaut si aucune autre n'est trouvée
}

// Configuration du serveur Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Route de test
app.get("/", (req, res) => {
  res.status(200).json({ message: "Serveur opérationnel" });
});

// Middleware pour les routes auth
app.use("/api/auth", (req, res, next) => {
  console.log("Middleware activé pour /api/auth");
  next();
});

// Route d'inscription
app.get(
  "/api/auth/register",
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

// Route de connexion
app.post(
  "/api/auth/login",
  [
    // Validation des champs
    body("email").isEmail().withMessage("Email invalide"),
    body("password").not().isEmpty().withMessage("Le mot de passe est requis"),
  ],
  async (req, res) => {
    console.log("Requête reçue pour la connexion");

    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Vérifier si l'utilisateur existe
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Identifiants invalides" });
      }

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Identifiants invalides" });
      }

      // Création d'un token JWT
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h", // Le token expire dans 1 heure
      });

      // Réponse avec le token
      res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Erreur serveur" });
    }
  }
);

// Configuration des sockets
io.on("connection", (socket) => {
  console.log("Client connecté");

  // Envoie un message de confirmation lorsque le client se connecte
  socket.emit("serverMessage", { message: "Connexion réussie au serveur" });

  // Écoute des messages du client
  socket.on("clientMessage", (data) => {
    console.log("Message du client:", data);
  });

  // Gestion de la déconnexion du client
  socket.on("disconnect", () => {
    console.log("Client déconnecté");
  });
});

// Obtention de l'adresse IP locale et affichage
const ipAddress = getLocalIPAddress();
console.log(`Le serveur écoute sur l'adresse IP: ${ipAddress}`);

// Démarrage du serveur
const port = parseInt(process.env.PORT, 10) || 5000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${ipAddress}:${port}`);
});
