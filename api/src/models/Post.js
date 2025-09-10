import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [500, 'Post content cannot exceed 500 characters']
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required for a post']
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantTags: [{
    type: String,
    trim: true
  }],
  dishTags: [{
    type: String,
    trim: true
  }],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments on this post
PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

// Create indexes for common queries
PostSchema.index({ user: 1 });
PostSchema.index({ restaurantTags: 1 });
PostSchema.index({ dishTags: 1 });
PostSchema.index({ createdAt: -1 }); // For feed sorting
PostSchema.index({ restaurantTags: 'text', dishTags: 'text', content: 'text' }); // Text search

const Post = mongoose.model('Post', PostSchema);

export default Post; 