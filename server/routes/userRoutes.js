const express = require("express");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  getProfilePicture,
  updateProfilePicture,
  upload,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Routes publiques
router.post("/register", upload.single("profilePicture"), registerUser);
router.post("/login", loginUser);
router.get("/profilePicture/:userId", getProfilePicture);
router.post(
  "/upload",
  protect,
  upload.single("profilePicture"),
  updateProfilePicture
);

// Route protégée
router.get("/me", protect, getCurrentUser);

module.exports = router;
