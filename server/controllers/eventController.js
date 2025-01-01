const Event = require("../models/eventModel");

// Créer un événement
exports.createEvent = async (req, res) => {
  try {
    const { title, description, startDate, endDate, location } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Une image est requise" });
    }

    const event = new Event({
      user: req.user.id, // ID de l'utilisateur connecté
      title,
      description,
      startDate,
      endDate,
      location,
      images: req.files.map((file) => file.path), // Stocker les chemins des images
    });

    await event.save();
    res.status(201).json({ message: "Événement créé avec succès", event });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
