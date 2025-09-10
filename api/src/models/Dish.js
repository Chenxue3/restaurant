import mongoose from 'mongoose';

const DishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dish name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  images: [String],
  ingredients: [String],
  allergens: [String],
  flavor_profile: {
    type: String,
    trim: true
  },
  texture: [String],
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  spicyLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DishCategory',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  popularityScore: {
    type: Number,
    default: 0
  },
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
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for posts about this dish
DishSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'dishes'
});

// Create indexes for common queries
DishSchema.index({ restaurant: 1, category: 1 });
DishSchema.index({ name: 'text', description: 'text' });

const Dish = mongoose.model('Dish', DishSchema);

export default Dish; 