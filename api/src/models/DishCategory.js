import mongoose from 'mongoose';

const DishCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
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

// Virtual for dish items in this category
DishCategorySchema.virtual('dishItems', {
  ref: 'Dish',
  localField: '_id',
  foreignField: 'category'
});

const DishCategory = mongoose.model('DishCategory', DishCategorySchema);

export default DishCategory; 