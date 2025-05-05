import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
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
    },
    role: {
      type: String,
      enum: ["customer", "affiliate", "service_provider"],
      default: "customer",
    },
    address: {
      street: String,
      city: String,
      state: String,
      district: String,
      pincode: String,
      country: String,
    },
    profileImage: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    // For affiliates
    affiliateInfo: {
      qrCode: String,
      totalEarnings: {
        type: Number,
        default: 0,
      },
      availableBalance: {
        type: Number,
        default: 0,
      },
      bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
        bankName: String,
      },
    },
    // For service providers
    serviceProviderInfo: {
      businessName: String,
      businessDescription: String,
      serviceCategories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      ratings: {
        average: {
          type: Number,
          default: 0,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
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
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
// Method to get user's district and state for admin assignment
userSchema.methods.getRegionInfo = function () {
  return {
    district: this.address?.district,
    state: this.address?.state,
    country: this.address?.country,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
