import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Restaurant from '../models/Restaurant.js';
import Dish from '../models/Dish.js';
import azureStorage from '../services/azureStorage.js';

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const { restaurantTag, foodTag, user, sort = 'recent' } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Filter by restaurant tag
    if (restaurantTag) {
      query.restaurantTags = { $in: [restaurantTag] };
    }
    
    // Filter by food tag
    if (foodTag) {
      query.foodTags = { $in: [foodTag] };
    }
    
    // Filter by user
    if (user) {
      query.user = user;
    }
    
    // Build sort object
    const sortObj = {};
    if (sort === 'likes') {
      sortObj.likes = -1;
    } else if (sort === 'rating') {
      sortObj.rating = -1;
    } else {
      sortObj.createdAt = -1; // Default sort by most recent
    }
    
    // Search by text if provided
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    const posts = await Post.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profileImage');
    
    // Get total count for pagination
    const total = await Post.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name profileImage');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Get comments for this post
    const comments = await Comment.find({ post: post._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name profileImage');
    
    // Fetch restaurants and dishes by tags if needed
    let restaurantInfo = [];
    let dishInfo = [];
    
    if (post.restaurantTags && post.restaurantTags.length > 0) {
      restaurantInfo = await Restaurant.find({
        name: { $in: post.restaurantTags }
      }).select('name address contactInfo');
    }
    
    if (post.dishTags && post.dishTags.length > 0) {
      dishInfo = await Dish.find({
        name: { $in: post.dishTags }
      }).select('name price images');
    }
    
    res.status(200).json({
      success: true,
      data: {
        post,
        comments,
        restaurantInfo,
        dishInfo
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    // Add current user as author
    req.body.user = req.user._id;
    
    // Process tags from request
    if (req.body.restaurantTags) {
      // Ensure restaurantTags is an array
      if (typeof req.body.restaurantTags === 'string') {
        req.body.restaurantTags = req.body.restaurantTags.split(',').map(tag => tag.trim());
      }
    }
    
    if (req.body.dishTags) {
      // Ensure dishTags is an array
      if (typeof req.body.dishTags === 'string') {
        req.body.dishTags = req.body.dishTags.split(',').map(tag => tag.trim());
      }
    }
    
    // Process uploaded images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required for a post'
      });
    }
    
    // Upload images to Azure Blob Storage
    const imageUrls = [];
    for (const file of req.files) {
      const imageUrl = await azureStorage.uploadImage(file, 'posts');
      imageUrls.push(imageUrl);
    }
    
    req.body.images = imageUrls;
    
    const post = await Post.create(req.body);
    
    // Populate user
    const populatedPost = await Post.findById(post._id)
      .populate('user', 'name profileImage');
    
    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if user is the author
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }
    
    // Process tags from request
    if (req.body.restaurantTags) {
      // Ensure restaurantTags is an array
      if (typeof req.body.restaurantTags === 'string') {
        req.body.restaurantTags = req.body.restaurantTags.split(',').map(tag => tag.trim());
      }
    }
    
    if (req.body.dishTags) {
      // Ensure dishTags is an array
      if (typeof req.body.dishTags === 'string') {
        req.body.dishTags = req.body.dishTags.split(',').map(tag => tag.trim());
      }
    }
    
    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      // Upload new images to Azure Blob Storage
      const newImageUrls = [];
      for (const file of req.files) {
        const imageUrl = await azureStorage.uploadImage(file, 'posts');
        newImageUrls.push(imageUrl);
      }
      
      // Add to existing images or replace if specified
      if (req.body.replaceImages === 'true') {
        // If replacing images, delete old ones from Azure
        for (const oldImageUrl of post.images) {
          await azureStorage.deleteImage(oldImageUrl);
        }
        req.body.images = newImageUrls;
      } else {
        req.body.images = [...(post.images || []), ...newImageUrls];
      }
    }
    
    post = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name profileImage');
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if user is the author
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }
    
    // Delete images from Azure Blob Storage
    for (const imageUrl of post.images) {
      await azureStorage.deleteImage(imageUrl);
    }
    
    // Delete all comments associated with this post
    await Comment.deleteMany({ post: post._id });
    
    // Delete the post
    await post.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

// @desc    Like/unlike post
// @route   PUT /api/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if already liked
    const alreadyLiked = post.likedBy.includes(req.user._id);
    
    if (alreadyLiked) {
      // Unlike the post
      post.likes = Math.max(0, post.likes - 1);
      post.likedBy = post.likedBy.filter(userId => userId.toString() !== req.user._id.toString());
    } else {
      // Like the post
      post.likes += 1;
      post.likedBy.push(req.user._id);
    }
    
    await post.save();
    
    res.status(200).json({
      success: true,
      data: {
        likes: post.likes,
        liked: !alreadyLiked
      }
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking post',
      error: error.message
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Create comment
    const comment = await Comment.create({
      content: req.body.content,
      user: req.user._id,
      post: post._id
    });
    
    // Populate user
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name profileImage');
    
    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user is the comment author
    if (comment.user.toString() !== req.user._id.toString()) {
      // Also check if user is the post author
      const post = await Post.findById(comment.post);
      if (post.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this comment'
        });
      }
    }
    
    await comment.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
}; 