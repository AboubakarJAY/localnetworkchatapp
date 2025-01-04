const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { protect } = require("../middlewares/authMiddleware");

router.post(
  "/",
  protect,
  eventController.uploadEventImages, // Corrigé ici
  eventController.createEvent
);
router.get("/discovery", protect, eventController.getAllEvents);
router.get("/followed", protect, eventController.getFollowedEvents);
router.post("/:eventId/join", protect, eventController.joinEvent);

module.exports = router;
