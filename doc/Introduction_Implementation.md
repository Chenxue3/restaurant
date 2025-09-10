# Technical Implementation
## Technical Architecture
![image](https://github.com/user-attachments/assets/f560cb43-81ed-4c75-b44d-8c99bbccd33e)

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (v15.3.0) with [React.js](https://react.dev/) (v18.3.x)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) components based on [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4.1.x)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Testing**: [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Backend
- **Framework**: [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/) (v5.1.x)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) (v7.x)
- **Storage**: [Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs/) for image uploads
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/)
- **Caching**: [Redis](https://redis.io/)
- **Email**: [Azure Communication Services](https://azure.microsoft.com/en-us/products/communication-services/)
- **Testing**: [Vitest](https://vitest.dev/) with [Supertest](https://github.com/ladjs/supertest)
- **API**: [OpenAI](https://openai.com/) for chatbot functionality



## Project Structure

### Root Directory
```
smartsavor-monorepo/
├── api/                   # Backend code
├── web/                   # Frontend code
├── doc/                   # Documentation files
├── package.json           # Root dependencies and scripts
└── README.md              # Project documentation
```

### Backend (`api`)
```
api/
├── src/
│   ├── app.js             # Express application entry point
│   ├── config/            # Configuration files
│   ├── controllers/       # API request handlers
│   ├── middlewares/       # Express middlewares
│   ├── models/            # Mongoose data models
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic and third-party services
│   └── util/              # Utility functions (including address parsing and chatbot)
├── .env                   # Environment variables (not committed to repo)
└── package.json           # Backend dependencies
```

### Frontend (`web`)
```
web/
├── src/
│   ├── app/               # Next.js app router pages and layouts
│   ├── components/        # Reusable React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions, configurations, and constants
│   ├── services/          # API client services
│   ├── test/              # Test setup and mocks
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── .env                   # Environment variables (not committed to repo)
└── package.json           # Frontend dependencies
```