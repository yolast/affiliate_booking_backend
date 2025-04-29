import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    leadId: {
      type: String,
      unique: true,
      required: true,
    },
    type: {
      type: String,
      enum: ["loan", "insurance", "real_estate"],
      required: [true, "Lead type is required"],
    },
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminChain: {
      dsaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      ssaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      nsaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
    },
    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      default: "new",
    },
    // Common lead information
    customerInfo: {
      name: String,
      email: String,
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        district: String,
        pincode: String,
        country: String,
      },
    },
    // Loan specific information
    loanInfo: {
      loanType: {
        type: String,
        enum: ["personal", "home", "business", "education", "vehicle", "other"],
      },
      amount: Number,
      tenure: Number, // in months
      purpose: String,
      employmentType: {
        type: String,
        enum: ["salaried", "self_employed", "business", "unemployed", "other"],
      },
      monthlyIncome: Number,
      existingLoans: [
        {
          type: String,
          amount: Number,
          emi: Number,
          remainingTenure: Number,
        },
      ],
      documents: [
        {
          type: {
            type: String,
            enum: [
              "identity",
              "address",
              "income",
              "bank_statement",
              "property",
              "other",
            ],
          },
          name: String,
          url: String,
          uploadedAt: Date,
          status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
          },
        },
      ],
    },
    // Insurance specific information
    insuranceInfo: {
      insuranceType: {
        type: String,
        enum: ["life", "health", "vehicle", "property", "travel", "other"],
      },
      coverAmount: Number,
      term: Number, // in years
      existingInsurance: Boolean,
      familyMembers: [
        {
          relation: String,
          name: String,
          age: Number,
          preExistingConditions: [String],
        },
      ],
      documents: [
        {
          type: {
            type: String,
            enum: [
              "identity",
              "address",
              "medical",
              "vehicle",
              "property",
              "other",
            ],
          },
          name: String,
          url: String,
          uploadedAt: Date,
          status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
          },
        },
      ],
    },
    // Real Estate specific information
    realEstateInfo: {
      transactionType: {
        type: String,
        enum: ["buy", "sell", "rent", "lease"],
      },
      propertyType: {
        type: String,
        enum: ["apartment", "house", "villa", "plot", "commercial", "other"],
      },
      budget: {
        min: Number,
        max: Number,
      },
      location: {
        areas: [String],
        city: String,
        state: String,
      },
      requirements: [String],
      propertyDetails: {
        size: Number, // in sq ft
        bedrooms: Number,
        bathrooms: Number,
        amenities: [String],
        age: Number, // in years
        furnishingStatus: {
          type: String,
          enum: ["unfurnished", "semi_furnished", "fully_furnished"],
        },
      },
      documents: [
        {
          type: {
            type: String,
            enum: [
              "identity",
              "address",
              "property",
              "legal",
              "financial",
              "other",
            ],
          },
          name: String,
          url: String,
          uploadedAt: Date,
          status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
          },
        },
      ],
    },
    // Communication and follow-up tracking
    communications: [
      {
        type: {
          type: String,
          enum: ["call", "email", "message", "meeting", "other"],
        },
        direction: {
          type: String,
          enum: ["inbound", "outbound"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        content: String,
        conductedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "communications.conductedByModel",
        },
        conductedByModel: {
          type: String,
          enum: ["Admin", "User"],
        },
        followUpDate: Date,
        outcome: String,
      },
    ],
    // Notes and attachments
    notes: [
      {
        content: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "notes.createdByModel",
        },
        createdByModel: {
          type: String,
          enum: ["Admin", "User"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "attachments.uploadedByModel",
        },
        uploadedByModel: {
          type: String,
          enum: ["Admin", "User"],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Tracking information
    source: {
      type: String,
      enum: ["qr_scan", "website", "referral", "direct", "other"],
      default: "qr_scan",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    expectedClosureDate: Date,
    closedAt: Date,
    closureReason: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Generate a unique lead ID before saving
leadSchema.pre("save", async function (next) {
  if (!this.leadId) {
    // Generate a unique lead ID with prefix based on type followed by timestamp and random digits
    const prefix =
      this.type === "loan" ? "LN" : this.type === "insurance" ? "IN" : "RE";
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.leadId = `${prefix}${timestamp}${random}`;
  }
  next();
});

// Indexes for efficient querying
leadSchema.index({ userId: 1, type: 1 });
leadSchema.index({ affiliateId: 1 });
leadSchema.index({ "adminChain.dsaId": 1, status: 1 });
leadSchema.index({ "adminChain.ssaId": 1 });
leadSchema.index({ "adminChain.nsaId": 1 });
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ type: 1, status: 1, priority: 1 });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
