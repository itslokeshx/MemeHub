# MemeHub

A complete MERN stack application for uploading, searching, and downloading memes.

---

## 📁 Folder Structure

```
MemeHub/
├── backend/      # Node.js + Express + MongoDB + Cloudinary
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── routes/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/     # React + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
└── README.md
```

---

## 🖥️ Local Setup Guide

### 1. Clone the project
```bash
git clone <repo-url>
cd MemeHub
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env # Fill in your MongoDB & Cloudinary credentials
npm install
npm start
```
Backend runs on [http://localhost:5000](http://localhost:5000)

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run start
```
Frontend runs on [http://localhost:3000](http://localhost:3000)

---

## 🌐 Free Hosting Guide

### 1. **Database (MongoDB Atlas)**
- Go to https://www.mongodb.com/atlas
- Create free cluster
- Add your IP as `0.0.0.0/0` (allow all)
- Get connection string → Add to backend `.env`

### 2. **Image Hosting (Cloudinary)**
- Go to https://cloudinary.com
- Create free account
- Get `cloud_name`, `api_key`, `api_secret`
- Add to backend `.env`

### 3. **Backend Hosting (Render)**
- Push backend code to GitHub
- Go to https://render.com
- Create new Web Service → Connect GitHub repo
- Add environment variables (`MONGO_URI`, `CLOUD_NAME`, etc.)
- Set start command: `node server.js`
- Deploy → Get backend URL (e.g., `https://memehub-api.onrender.com`)

### 4. **Frontend Hosting (Vercel)**
- Push frontend code to GitHub
- Go to https://vercel.com
- Import repo
- Add `VITE_API_URL=https://memehub-api.onrender.com` in settings
- Deploy → Get frontend URL (e.g., `https://memehub.vercel.app`)

---

## 🔗 Final Setup
- Frontend: `https://memehub.vercel.app`
- Backend: `https://memehub-api.onrender.com`
- Database: MongoDB Atlas
- Images: Cloudinary

---

## 🚀 Features
- Upload memes (image + title + tags)
- Store images in Cloudinary, metadata in MongoDB Atlas
- View memes in a responsive grid
- Search memes by title/tags
- Download memes
- Dark theme UI (TailwindCSS)

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express, MongoDB, Cloudinary
- **Frontend:** React, TailwindCSS, Axios, Vite
