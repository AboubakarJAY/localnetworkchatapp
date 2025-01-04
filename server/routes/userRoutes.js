const express = require("express");
const multer = require("multer"); // Import de multer
const {
  registerUser,
  loginUser,
  getCurrentUser,
  getProfilePicture,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

// Configuration de multer pour gérer les fichiers
const storage = multer.memoryStorage(); // Stockage en mémoire (vous pouvez changer selon vos besoins)
const upload = multer({ storage });

// Routes publiques
router.post(
  "/register",
  upload.single("profilePicture"),
  (req, res, next) => {
    console.log("Requête reçue");
    next(); // Passer à la logique suivante (registerUser)
  },
  registerUser
);

// Route pour récupérer l'image de profil
router.get("/profilePicture/:userId", getProfilePicture);

router.post("/register", upload.single("profilePicture"), registerUser);
router.post("/login", loginUser);

// Route protégée
router.get("/me", protect, getCurrentUser);

module.exports = router;
