const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      default: 100,
      enum: [100, 101],
    },
    profilePicture: {
      type: Object,
      default: "",
    },
    coverPicture: {
      type: Object,
      default: "",
    },
    about: String,
    livesIn: String,
    country: String,
    worksAt: String,
    relationship: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", userSchema);