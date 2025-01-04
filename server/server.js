const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { errorHandler } = require("./middlewares/errorMiddleware");
const socketIo = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

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

// Routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));

// Route de test
app.get("/", (req, res) => {
  res.status(200).json({ message: "Serveur opérationnel" });
});
app.use(errorHandler);
app.use("/uploads", express.static("uploads"));

// Obtention de l'adresse IP locale et affichage
const ipAddress = getLocalIPAddress();
console.log(`Le serveur écoute sur l'adresse IP: ${ipAddress}`);

// Démarrage du serveur
const port = parseInt(process.env.PORT, 10) || 5000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${ipAddress}:${port}`);
});
