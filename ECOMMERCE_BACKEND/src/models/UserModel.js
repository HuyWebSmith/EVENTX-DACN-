const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Mongoose sẽ xử lý việc xác thực qua một thư viện khác (ví dụ: Passport, JWT)

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, require: true },

    fullName: { type: String, required: true, maxLength: 100 },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dateOfBirth: { type: Date },
    avatarUrl: { type: String, trim: true },
    rolePreference: { type: String }, // Attendee, Speaker, Sponsor, Organizer
    interestArea: { type: String },
    bio: { type: String },
    linkedInProfile: { type: String, trim: true },
    address: { type: String },

    createdAt: { type: Date, default: Date.now },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt (thay cho CreatedAt thủ công)
  }
);

module.exports = mongoose.model("ApplicationUser", userSchema);
