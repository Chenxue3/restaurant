import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  googlePlaceId: {
    type: String,
    unique: true,
    sparse: true  // Allow null values, but non-null values must be unique
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  openingHours: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    open: String,
    close: String,
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  images: [String],
  logoImage: String,
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cuisineType: [String],
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
  hasStudentDiscount: {
    type: Boolean,
    default: false
  },
  discountDescription: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index for location-based queries
RestaurantSchema.index({ location: '2dsphere' });

// Virtual for dish items
RestaurantSchema.virtual('dishItems', {
  ref: 'Dish',
  localField: '_id',
  foreignField: 'restaurant'
});

// Virtual for posts
RestaurantSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'restaurant'
});

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

export default Restaurant; 