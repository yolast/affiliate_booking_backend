import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["super_admin", "nsa", "ssa", "dsa"],
      required: [true, "Admin role is required"],
      default: "super_admin",
    },
    // For NSA (National Sales Associate)
    nsaInfo: {
      country: String,
      commissionRate: {
        type: Number,
        default: 0,
      },
    },
    // For SSA (State Sales Associate)
    ssaInfo: {
      state: String,
      country: String,
      commissionRate: {
        type: Number,
        default: 0,
      },
    },
    // For DSA (District Sales Associate)
    dsaInfo: {
      district: String,
      state: String,
      country: String,
      commissionRate: {
        type: Number,
        default: 0,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator admin reference is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    profileImage: String,
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find responsible admins for a region
adminSchema.statics.findAdminsForRegion = async function (
  district,
  state,
  country
) {
  const admins = {
    dsa: null,
    ssa: null,
    nsa: null,
  };

  // Find DSA for the district
  if (district && state) {
    admins.dsa = await this.findOne({
      role: "dsa",
      "dsaInfo.district": district,
      "dsaInfo.state": state,
      isActive: true,
    });
  }

  // Find SSA for the state
  if (state) {
    admins.ssa = await this.findOne({
      role: "ssa",
      "ssaInfo.state": state,
      isActive: true,
    });
  }

  // Find NSA for the country
  if (country) {
    admins.nsa = await this.findOne({
      role: "nsa",
      "nsaInfo.country": country,
      isActive: true,
    });
  }

  return admins;
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
