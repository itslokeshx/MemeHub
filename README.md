# MemeHub

MemeHub is a full-stack MERN (MongoDB, Express, React, Node.js) application for uploading, searching, and managing memes. It features a modern, responsive UI, admin dashboard, and supports both MongoDB and in-memory storage for development.

## Features

- **User Features:**
  - Upload memes with title, tags, and image
  - Search memes by title or tags (instant search)
  - Responsive design for mobile and desktop
  - View memes in a grid layout
  - Pagination for meme browsing

- **Admin Features:**
  - Secure admin login/logout (credentials via environment variables)
  - Admin dashboard for managing memes
  - Rename meme titles (PATCH)
  - Delete memes (DELETE)
  - Admin-only controls in the UI

- **Backend:**
  - RESTful API with Express.js
  - MongoDB (via Mongoose) or in-memory storage fallback
  - File uploads with Multer
  - Image hosting via Cloudinary
  - Zod for schema validation
  - Environment-based configuration

- **Frontend:**
  - Built with React + Vite
  - Wouter for routing
  - Tailwind CSS for styling
  - Lucide icons
  - Modern, accessible UI components

## Project Structure

```
MemeHub/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # UI components (navbar, meme-card, etc.)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API utilities, query client
│   │   └── pages/         # Page components (home, upload, admin-login, admin-dashboard)
│   └── index.html
├── server/                # Express backend
│   ├── index.ts           # Entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # MongoDB and in-memory storage classes
│   ├── storage.ts         # Storage interface and logic
│   └── vite.ts            # Vite server config
├── shared/                # Shared types and schema
│   └── schema.ts
├── package.json           # Project metadata and scripts
├── tailwind.config.ts     # Tailwind CSS config
├── drizzle.config.ts      # (Optional) Drizzle ORM config
└── ...
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB (for production or persistent storage)
- Cloudinary account (for image uploads)

### Environment Variables
Create a `.env` file in the root and in `client/` with the following:

#### Server `.env`:
```
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

#### Client `.env`:
```
VITE_ADMIN_USERNAME=your_admin_username
VITE_ADMIN_PASSWORD=your_admin_password
```

### Install Dependencies

```
npm install
cd client && npm install
```

### Run the App (Development)

Start the backend:
```
npm run dev
```

Start the frontend:
```
cd client
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) for the frontend.

## API Endpoints

- `GET /api/memes` - List memes (supports search, pagination)
- `GET /api/memes/:id` - Get meme by ID
- `POST /api/memes` - Upload a new meme
- `PATCH /api/memes/:id` - Rename meme (admin only)
- `DELETE /api/memes/:id` - Delete meme (admin only)

## Customization
- **Switch to in-memory storage:** Remove or comment out `MONGODB_URI` in `.env` for local/dev mode.
- **Styling:** Edit `tailwind.config.ts` and component classes for custom themes.
- **Admin credentials:** Change in `.env` and `client/.env`.

## Deployment
- Deploy backend to services like Render, Railway, or Heroku.
- Deploy frontend to Vercel, Netlify, or similar.
- Set environment variables in your deployment platform.

## License

MIT

---

### Credits
- Built with React, Express, MongoDB, Vite, Tailwind CSS, and Cloudinary.
- Icons by Lucide.
- UI inspired by modern meme and content sharing platforms.
