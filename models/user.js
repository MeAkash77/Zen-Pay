import mongoose, { Schema, model, models } from "mongoose";

// Define the User schema
const UserSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true, // Clerk user ID
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  zpi: {
    type: String,
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 250,
  },
}, {
  timestamps: true,
});

// Export the model
export const User = models.User || model("User", UserSchema);
