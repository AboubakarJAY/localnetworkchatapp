const multer = require("multer");
const jwt = require("jsonwebtoken");
const Event = require("../models/eventModel");
const path = require("path");
const fs = require("fs");

// Vérifier si le dossier existe, sinon le créer
const uploadDirectory = path.join(__dirname, "../uploads/events");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configuration de Multer pour les fichiers en mémoire
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory); // Dossier de stockage des images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Nom unique pour chaque fichier
  },
});

const upload = multer({ storage });

// Middleware pour gérer l'upload d'images
exports.uploadEventImages = upload.array("images"); // Utilisé dans la route pour uploader plusieurs fichiers

// Fonction pour créer un événement
exports.createEvent = async (req, res) => {
  try {
    const { title, description, startDate, endDate, location } = req.body;

    // Validation des champs obligatoires
    if (!title || !description || !startDate || !endDate || !location) {
      return res
        .status(400)
        .json({ message: "Tous les champs sont obligatoires." });
    }

    const now = new Date();
    if (new Date(startDate) < now) {
      return res
        .status(400)
        .json({ message: "La date de début ne peut pas être dans le passé." });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res
        .status(400)
        .json({ message: "La date de fin doit être après la date de début." });
    }

    // Sauvegarder les chemins des fichiers relatifs si des fichiers sont uploadés
    const imagePaths = req.files
      ? req.files.map((file) => `/uploads/events/${file.filename}`)
      : []; // Si pas d'images, retourner un tableau vide

    // Création de l'événement avec les images
    const event = new Event({
      user: req.user.id, // ID de l'utilisateur connecté récupéré par le middleware `protect`
      title,
      description,
      startDate,
      endDate,
      location,
      images: imagePaths, // Chemins des fichiers relatifs
    });

    await event.save();
    res.status(201).json({ message: "Événement créé avec succès", event });
  } catch (error) {
    console.error(error); // Afficher l'erreur pour faciliter le débogage
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer tous les événements
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate(
      "user",
      "name email profilePicture"
    );

    // Ajouter les URLs des images à chaque événement avec liens relatifs
    const eventsWithImageUrls = events.map((event) => {
      // Vérifiez que `event.images` est un tableau
      const imagePaths =
        Array.isArray(event.images) && event.images.length > 0
          ? event.images.map(
              (image) => `/uploads/events/${path.basename(image)}`
            )
          : []; // Si pas d'images, retourner un tableau vide

      return {
        ...event._doc, // Inclure toutes les autres informations de l'événement
        images: imagePaths, // Liens relatifs vers les images
      };
    });

    res.status(200).json(eventsWithImageUrls);
  } catch (error) {
    console.error(error); // Afficher l'erreur pour faciliter le débogage
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer une image d'un événement
exports.getEventImage = async (req, res) => {
  const { eventId, imageIndex } = req.params;

  try {
    const event = await Event.findById(eventId);

    if (!event || !event.images || event.images.length <= imageIndex) {
      return res.status(404).json({ message: "Image non trouvée." });
    }

    const imagePath = event.images[imageIndex]; // Le chemin relatif vers l'image
    const imageFullPath = path.join(__dirname, "../", imagePath); // Créer le chemin absolu

    res.sendFile(imageFullPath); // Envoyer l'image au client
  } catch (error) {
    console.error(error); // Afficher l'erreur pour faciliter le débogage
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer les événements des utilisateurs suivis
exports.getFollowedEvents = async (req, res) => {
  try {
    // Récupérer les utilisateurs suivis par l'utilisateur actuel
    const user = await User.findById(req.user.id).populate("followers");

    // Récupérer les événements créés par ces utilisateurs
    const followedEvents = await Event.find({
      user: { $in: user.followers.map((follower) => follower._id) },
    }).populate("user", "name email");

    res.status(200).json(followedEvents);
  } catch (error) {
    console.error(error); // Afficher l'erreur pour faciliter le débogage
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Participer à un événement
exports.joinEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);

    // Vérifier si l'utilisateur est déjà inscrit
    if (event.participants.includes(req.user.id)) {
      return res
        .status(400)
        .json({ message: "Vous participez déjà à cet événement." });
    }

    // Ajouter l'utilisateur à la liste des participants
    event.participants.push(req.user.id);
    await event.save();

    res
      .status(200)
      .json({ message: "Vous avez rejoint cet événement avec succès." });
  } catch (error) {
    console.error(error); // Afficher l'erreur pour faciliter le débogage
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
