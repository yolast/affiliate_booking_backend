import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    serviceProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Service provider reference is required"],
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
    bookingDetails: {
      date: {
        type: Date,
        required: [true, "Booking date is required"],
      },
      timeSlot: {
        startTime: String,
        endTime: String,
      },
      customFields: mongoose.Schema.Types.Mixed, // Stores the custom booking fields data
      specialRequests: String,
      numberOfPeople: Number,
    },
    pricing: {
      basePrice: {
        type: Number,
        required: [true, "Base price is required"],
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      additionalCharges: [
        {
          name: String,
          amount: Number,
        },
      ],
      taxAmount: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: [true, "Total amount is required"],
      },
    },
    payments: [
      {
        paymentId: String,
        type: {
          type: String,
          enum: ["token", "full", "partial", "refund"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed", "refunded"],
          default: "pending",
        },
        paymentMethod: String,
        transactionId: String,
        razorpayPaymentId: String,
        razorpayOrderId: String,
        razorpaySignature: String,
        paidAt: Date,
      },
    ],
    commissions: {
      affiliate: {
        amount: Number,
        status: {
          type: String,
          enum: ["pending", "processing", "paid", "failed"],
          default: "pending",
        },
        paidAt: Date,
      },
      dsa: {
        amount: Number,
        status: {
          type: String,
          enum: ["pending", "processing", "paid", "failed"],
          default: "pending",
        },
        paidAt: Date,
      },
      ssa: {
        amount: Number,
        status: {
          type: String,
          enum: ["pending", "processing", "paid", "failed"],
          default: "pending",
        },
        paidAt: Date,
      },
      nsa: {
        amount: Number,
        status: {
          type: String,
          enum: ["pending", "processing", "paid", "failed"],
          default: "pending",
        },
        paidAt: Date,
      },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "refunded"],
      default: "pending",
    },
    cancellationDetails: {
      cancelledAt: Date,
      reason: String,
      cancelledBy: {
        type: String,
        enum: ["user", "service_provider", "admin", "system"],
      },
      refundAmount: Number,
      refundStatus: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
      },
    },
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      createdAt: Date,
    },
    notes: [
      {
        content: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "notes.createdByModel",
        },
        createdByModel: {
          type: String,
          enum: ["User", "Admin"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

// Generate a unique booking ID before saving
bookingSchema.pre("save", async function (next) {
  if (!this.bookingId) {
    // Generate a unique booking ID with prefix 'BK' followed by timestamp and random digits
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.bookingId = `BK${timestamp}${random}`;
  }
  next();
});

// Method to calculate total amount
bookingSchema.methods.calculateTotalAmount = function () {
  let total = this.pricing.basePrice - this.pricing.discountAmount;

  // Add additional charges
  if (
    this.pricing.additionalCharges &&
    this.pricing.additionalCharges.length > 0
  ) {
    for (const charge of this.pricing.additionalCharges) {
      total += charge.amount;
    }
  }

  // Add tax
  total += this.pricing.taxAmount;

  this.pricing.totalAmount = total;
  return total;
};

// Method to check if booking is fully paid
bookingSchema.methods.isFullyPaid = function () {
  const totalPaid = this.payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return totalPaid >= this.pricing.totalAmount;
};

// Method to calculate commission amounts
bookingSchema.methods.calculateCommissions = function (commissionStructure) {
  const totalAmount = this.pricing.totalAmount;

  if (commissionStructure.isPercentage) {
    this.commissions.affiliate.amount =
      totalAmount * (commissionStructure.affiliateCommission / 100);
    this.commissions.dsa.amount =
      totalAmount * (commissionStructure.dsaCommission / 100);
    this.commissions.ssa.amount =
      totalAmount * (commissionStructure.ssaCommission / 100);
    this.commissions.nsa.amount =
      totalAmount * (commissionStructure.nsaCommission / 100);
  } else {
    this.commissions.affiliate.amount = commissionStructure.affiliateCommission;
    this.commissions.dsa.amount = commissionStructure.dsaCommission;
    this.commissions.ssa.amount = commissionStructure.ssaCommission;
    this.commissions.nsa.amount = commissionStructure.nsaCommission;
  }

  return this.commissions;
};

// Indexes for efficient querying
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ serviceProviderId: 1, status: 1 });
bookingSchema.index({ affiliateId: 1 });
bookingSchema.index({ "adminChain.dsaId": 1 });
bookingSchema.index({ "adminChain.ssaId": 1 });
bookingSchema.index({ "adminChain.nsaId": 1 });
bookingSchema.index({ "bookingDetails.date": 1, status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
