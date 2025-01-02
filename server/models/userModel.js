const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    profilePicture: {
      type: Buffer, // Stockage de l'image sous forme de buffer
    },
    contentType: {
      type: String, // Type MIME de l'image
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
