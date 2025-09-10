# SmartSavor API

A RESTful API for the SmartSavor application, providing endpoints for restaurant and food discovery, user authentication, and social features for food lovers.

## Features

- **Email-based Authentication**
  - Verification code sent via Azure Communication Services
  - Verification codes stored in Redis
  - Secure login and account creation

- **Restaurant Management**
  - Create, update, and delete restaurants
  - Search and filter restaurants by various criteria
  - Restaurant details, opening hours, and contact info
- **Chatbot Integration**
  - AI-powered chatbot for answering user queries related to food and restaurants.
  - Fetches responses from the `/api/chatbot/chat` endpoint.
  - Provides predefined questions and supports custom user queries.

- **Food and Menu Management**
  - Food items organized by categories (appetizers, main courses, desserts, etc.)
  - Detailed food information including price, ingredients, allergens, etc.
  - Support for images, dietary preferences, and popularity metrics

- **Social Features**
  - Create posts with multiple images
  - Comment on posts
  - Like/unlike posts
  - Discover posts in feed format
  - Tag restaurants and dishes in posts (using string tags)

- **Image Storage**
  - All images stored in Azure Blob Storage
  - Automatic clean-up when resources are deleted

## Tech Stack

- **Backend:** Node.js with Express.js
- **Database:** MongoDB with Mongoose ODM
- **Caching:** Redis for verification codes
- **Authentication:** JWT (JSON Web Tokens)
- **Email Service:** Azure Communication Services
- **Image Storage:** Azure Blob Storage
- **API Security:** Helmet, input validation, and proper authentication middleware

## Prerequisites

- Node.js (v14.x or higher)
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Azure Communication Services account for email
- Azure Blob Storage account for images

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smartsavor-api.git
   cd smartsavor-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3001
   # Database Configuration
   # For local MongoDB: mongodb://localhost:27017/smartsavor
   # For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/smartsavor?retryWrites=true&w=majority
   MONGODB_URI=mongodb://localhost:27017/smartsavor
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   EMAIL_CONNECTION_STRING=your_azure_email_connection_string
   EMAIL_FROM=noreply@smartsavor.com
   # Azure Blob Storage connection string format:
   # DefaultEndpointsProtocol=https;AccountName=your_account_name;AccountKey=your_account_key;EndpointSuffix=core.windows.net
   AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your_account_name;AccountKey=your_account_key;EndpointSuffix=core.windows.net
   REDIS_URL=redis://localhost:6379
   ```

### MongoDB Atlas Setup (if using cloud database)

If you're using MongoDB Atlas instead of a local MongoDB instance:

1. Create a MongoDB Atlas account at https://cloud.mongodb.com/
2. Create a new cluster
3. Create a database user with read/write permissions
4. Add your IP address to the Network Access whitelist:
   - Go to Network Access in your Atlas dashboard
   - Click "Add IP Address"
   - Add your current IP or use `0.0.0.0/0` for development (not recommended for production)
5. Get your connection string from the "Connect" button
6. Update the `MONGODB_URI` in your `.env` file with the Atlas connection string

**Common MongoDB Connection Issues:**
- **IP Whitelist Error**: Add your current IP address to MongoDB Atlas Network Access
- **Authentication Failed**: Check username and password in connection string
- **Connection Timeout**: Verify network connectivity and cluster status

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/send-code` - Send verification code to email
- `POST /api/auth/verify` - Verify code and login/register
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Restaurants

- `GET /api/restaurants` - Get all restaurants (with filters)
- `GET /api/restaurants/:id` - Get restaurant details
- `POST /api/restaurants` - Create new restaurant
- `PUT /api/restaurants/:id` - Update restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant

### Food Categories

- `GET /api/restaurants/:restaurantId/categories` - Get categories for a restaurant
- `POST /api/restaurants/:restaurantId/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Food Items

- `GET /api/restaurants/:restaurantId/dishes` - Get dishes for a restaurant
- `GET /api/dishes/:id` - Get food details
- `POST /api/restaurants/:restaurantId/dishes` - Create new food
- `PUT /api/dishes/:id` - Update food
- `DELETE /api/dishes/:id` - Delete food

### Posts

- `GET /api/posts` - Get posts (feed with tag filters)
- `GET /api/posts/:id` - Get post details
- `POST /api/posts` - Create new post with restaurant and food tags
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `PUT /api/posts/:id/like` - Like/unlike post

### Comments

- `POST /api/posts/:id/comments` - Add comment to post
- `DELETE /api/comments/:id` - Delete comment
## Chatbot API

- **`POST /api/chatbot/chat`**  - This endpoint is used by the chatbot to fetch responses for user queries.

## Data Models

- **User**: Basic account information
- **Restaurant**: Restaurant details and metadata
- **FoodCategory**: Categories for organizing menu items
- **Food**: Individual food items with details
- **Post**: User-generated content with images and tags
- **Comment**: Responses to posts

## License

This project is licensed under the ISC License.