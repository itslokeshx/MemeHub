# 🖼️ MemeHub - Community-Driven Meme CDN

MemeHub is a **Pinterest-style community meme platform** built with the MERN stack. It combines powerful admin tools for bulk content management with community-driven improvements, allowing users to collaboratively enhance meme metadata.

👉 **Live link:** [https://memehub-m4gy.onrender.com/](https://memehub-m4gy.onrender.com/)

---

## 🎯 Purpose  

The goal of MemeHub is to provide a **fun, open, and community-driven place** where:  
- Users can upload and explore memes.  
- Images are hosted securely on **Cloudinary**, while **MongoDB stores their URLs**.  
- Developers can **contribute freely** since the project is open-source.  

Anyone can raise issues, suggest improvements, or build new features. 🚀  
## ✨ Key Features

### 🎯 For Everyone
- **Browse & Search** - Instant search by name or tags with smart sorting
- **Community Edits** - Improve meme names and tags collaboratively
- **Download** - Save any meme with one click
- **Responsive Design** - Beautiful UI on mobile and desktop
- **Featured Memes** - Discover highlighted content

### 🔐 For Admins
- **JWT Authentication** - Secure login system
- **Bulk Upload** - Upload up to 50 memes at once
- **Moderation Tools** - Lock, feature, or delete memes
- **Edit History** - Track all community contributions
- **Admin Dashboard** - Comprehensive management interface

---

## 🚀 Tech Stack

### Frontend
- **React** + **TypeScript** - Type-safe UI components
- **Tailwind CSS** + **Radix UI** - Modern, accessible design
- **TanStack Query** - Efficient data fetching and caching
- **Vite** - Lightning-fast development

### Backend
- **Node.js** + **Express** - RESTful API server
- **MongoDB** + **Mongoose** - Document database with schemas
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Image CDN and storage
- **Zod** - Runtime type validation

### Deployment
- **Render** - Full-stack hosting
- **MongoDB Atlas** - Cloud database

---

## 📂 Project Structure

```
MemeHub/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Radix UI components
│   │   │   ├── meme-card.tsx  # Meme display card
│   │   │   └── navbar.tsx     # Navigation bar
│   │   ├── pages/             # Route pages
│   │   │   ├── home.tsx       # Main gallery
│   │   │   ├── meme-preview.tsx # Full meme view
│   │   │   ├── admin-login.tsx  # Admin authentication
│   │   │   └── admin-dashboard.tsx # Admin panel
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/               # Utilities and API client
│   └── index.html
├── server/                    # Express backend
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API endpoints
│   ├── storage.ts             # Database layer
│   ├── auth.ts                # JWT authentication
│   └── vite.ts                # Dev server config
├── scripts/                   # Utility scripts
│   └── setup-admin.js         # Create admin account
├── shared/                    # Shared TypeScript types
│   └── schema.ts              # Data models
└── package.json
```

---

## 🎯 Features in Detail

### Community Contribution System
- **Edit Tracking** - Every edit is logged with timestamps
- **Edit Counter** - Popular memes show community engagement
- **Lock Protection** - Admins can lock well-edited memes
- **No Deletions** - Users can only edit, preserving content

### Admin Moderation
- **Bulk Upload** - Default metadata ("memename", "memetag") for quick uploads
- **Lock/Unlock** - Prevent or allow community edits
- **Feature/Unfeature** - Highlight quality content
- **Delete** - Remove memes from both database and Cloudinary
- **View History** - See all edits made to any meme

### Smart Search & Sorting
- **Sort by Recent** - Newest uploads first
- **Sort by Popular** - Most community-edited memes
- **Sort by Featured** - Admin-highlighted content
- **Partial Matching** - Search works on partial names and tags

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/MemeHub.git
cd MemeHub
npm install
```

### 2. Environment Variables
Create a `.env` file:
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_secret_key_change_in_production

# Server
PORT=5000
```

### 3. Create Admin Account
```bash
node scripts/setup-admin.js
```
Follow the prompts to create your admin credentials.

### 4. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:5000`

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints

### Public Routes
```
GET    /api/memes              # Get all memes (with search & sort)
GET    /api/memes/:id          # Get single meme
PUT    /api/memes/:id/edit     # Edit meme (community)
```

### Admin Routes (Require JWT)
```
POST   /api/admin/register     # Create admin account
POST   /api/admin/login        # Login and get JWT token
POST   /api/admin/bulk-upload  # Upload multiple memes
DELETE /api/memes/:id           # Delete meme
PATCH  /api/admin/memes/:id/lock    # Lock/unlock meme
PATCH  /api/admin/memes/:id/feature # Feature/unfeature meme
GET    /api/admin/memes/:id/history # View edit history
```

---

## 🎨 Usage Guide

### For Regular Users
1. **Browse** - Visit homepage to see all memes
2. **Search** - Use search bar to find specific memes
3. **View** - Click any meme for full preview
4. **Edit** - Click "Edit Meme" button to improve metadata
5. **Download** - Save memes with the download button

### For Admins
1. **Login** - Go to `/admin-login` with your credentials
2. **Bulk Upload**:
   - Click "Bulk Upload" tab
   - Select multiple images (up to 50)
   - Click "Upload" - all get default metadata
3. **Moderate**:
   - Switch to "Manage Memes" tab
   - Lock memes to prevent edits
   - Feature quality memes
   - Delete inappropriate content
4. **Monitor** - View edit counts and history

---

## 🔒 Security Features

- **JWT Authentication** - 7-day token expiration
- **Password Hashing** - bcrypt with 10 salt rounds
- **Role-Based Access** - Admin-only routes protected
- **Input Validation** - Zod schemas on all endpoints
- **CORS Protection** - Configured for production

---

## 🤝 Contributing

MemeHub is **open-source (MIT License)** and welcomes contributions!

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You're free to use, modify, and distribute this project.

---

## Hosting

- **Cloudinary** - Image hosting and CDN
- **MongoDB** - Database solution
- **Radix UI** - Accessible component primitives
- **Render** - Deployment platform

---

## 📧 Contact

For questions, suggestions, or issues:
- 🐛 [GitHub Issues](https://github.com/yourusername/MemeHub/issues)
- 💬 [Discussions](https://github.com/yourusername/MemeHub/discussions)

---

**Built with ❤️ by the community**
