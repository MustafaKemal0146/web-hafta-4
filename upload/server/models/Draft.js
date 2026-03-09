const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["idea", "in-progress", "published"],
      default: "idea"
    },
    techStack: {
      type: [String],
      default: []
    },
    githubUrl: {
      type: String,
      default: ""
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Draft", draftSchema);
