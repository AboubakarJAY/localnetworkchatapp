const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // Lien vers l'utilisateur
      ref: "User", // Nom du modèle utilisateur
      required: true,
    },
    title: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "La description est obligatoire"],
    },
    images: [
      {
        type: String, // Chemins des images uploadées
      },
    ],
    startDate: {
      type: Date,
      required: [true, "La date de début est obligatoire"],
    },
    endDate: {
      type: Date,
      required: [true, "La date de fin est obligatoire"],
    },
    location: {
      type: String,
      required: [true, "Le lieu est obligatoire"],
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

module.exports = mongoose.model("Event", eventSchema);
