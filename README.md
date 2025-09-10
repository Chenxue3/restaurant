# SmartSavor
SmartSavor is a full-stack web application designed to enhance the dining experience by connecting users with restaurants,student discounts, dishes, and food-related content.

🔗 **Live Demo**: [https://smartsavor.up.railway.app/](https://smartsavor.up.railway.app/) 

## 📚 Documentation

- [Team Introduction](./doc/Introduction_Team.md)
- [Product Features](./doc/Introduction_Product_Features.md)
- [Peer Review Notes](./doc/Peer_Review_Notes.md)
- [User Manual](https://uoa-my.sharepoint.com/:p:/g/personal/kshu119_uoa_auckland_ac_nz/EUXianWpv95JlDI3Qd9VtRQBi7ZEzHHgUGXmh2XR8-8WUw?e=dnOG8l)
- [FAQs](./doc/FAQs.md)
- [Implementation Introduction](./doc/Introduction_Implementation.md)
- [API Test Coverage](./doc/Test_Coverage_API.md)
- [Web Test Coverage](./doc/Test_Coverage_Web.md)
- [Wiki Page](https://github.com/UOA-CS732-S1-2025/group-project-fancy-flamingos/wiki)
- [Code Convention](./doc/Code_Convention.md)

## 🔧 Prerequisites


- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- [MongoDB](https://www.mongodb.com/) (local or [MongoDB Atlas](https://www.mongodb.com/atlas/database))
- [Redis](https://redis.io/) (local or cloud) for caching
- [Azure Communication Services](https://azure.microsoft.com/en-us/products/communication-services/) account for email
- [Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs/) account for image storage
- [OpenAI API](https://openai.com/blog/openai-api) key for ai 
functionality

## ⚡ Quick Start

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/UOA-CS732-S1-2025/group-project-fancy-flamingos.git
cd group-project-fancy-flamingos
```

2. **Install all dependencies (frontend and backend):**
```bash
npm run install:all
```

This command installs:
- Root dependencies for running both services
- Frontend dependencies in the `web` directory
- Backend dependencies in the `api` directory

## ⚙️ Environment Setup

#### Frontend (`web` directory)
Create a `.env.local` file in the `web` directory:

```properties
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Backend (`api` directory)
Create a `.env` file in the `api` directory:

```properties
# Server configuration
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your_jwt_secret_should_be_changed
JWT_EXPIRES_IN=7d

# Email service (Azure Communication Services)
EMAIL_CONNECTION_STRING=endpoint=https://<your-email-endpoint>
EMAIL_FROM=donotreply@yourdomain.com

# Storage (Azure Blob Storage)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey;EndpointSuffix=core.windows.net

# Cache (Redis)
REDIS_URL=redis://default:<your-password>@<your-redis-host>:6379

# AI Services
OPENAI_API_KEY=sk-...

# External APIs
GOOGLE_PLACES_API_KEY=AIza...
```

## 💻 Development

### Running the Application

#### Start both frontend and backend concurrently:
```bash
npm start
```

This launches:
- 🌐 Frontend on http://localhost:3000
- 🔌 Backend on http://localhost:3001

#### Start only the frontend:
```bash
npm run start:web
```

#### Start only the backend:
```bash
npm run start:api
```

## 🏗️ Building for Production

```bash
npm run build
```

## 🧪 Testing

Frontend tests:
```bash
npm run test:web
```

Backend tests:
```bash
npm run test:api
```

**Note for Backend Tests**: Some tests might fail due to an expired login token. To fix this:
1. Log in to the application
2. Check the response from the `verify` endpoint in your browser's console, which will look like:
```json
 {
   "success": true,
   "isNewUser": false,
   "token": "your-jwt-token",
   "user": {
     "_id": "your-user-id",
     "email": "your-email"
   }
 }
```
 3. Update the `testToken` and `testUser` values in `api/tests/setup.js` with your current token and user information
 4. Run the tests again

# restaurant
