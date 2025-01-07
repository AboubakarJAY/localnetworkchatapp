const express = require("express");
const User = require("./models/User");
const app = express();

// API pour suivre un utilisateur
app.post("/follow", async (req, res) => {
  const { followerId, followedId } = req.body;

  try {
    // Trouver l'utilisateur suivi
    const followedUser = await User.findById(followedId);
    const followerUser = await User.findById(followerId);

    if (!followedUser || !followerUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ajouter le follower à la liste des abonnés
    followedUser.followers.push(followerId);
    await followedUser.save();

    // Envoyer une notification locale au téléphone de l'utilisateur suivi
    sendNotificationToClient(followedUser.deviceId, followerUser.name);

    res.status(200).json({ message: "Follower added and notification sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fonction pour envoyer la notification
const sendNotificationToClient = (deviceId, followerName) => {
  // Vous pouvez utiliser une requête HTTP ou WebSocket pour notifier le client
  // Exemple en utilisant une requête HTTP
  const notificationPayload = {
    deviceId: deviceId,
    message: `${followerName} vous suis !`,
  };

  // Envoyer la requête à l'application cliente (qui écoute sur un certain endpoint)
  fetch("http://<app_device_ip>:<port>/notify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(notificationPayload),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Notification sent to client:", data);
    })
    .catch((error) => {
      console.error("Error sending notification to client:", error);
    });
};

// Démarrer le serveur
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
