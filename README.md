# 🖼️ MemeHub  

MemeHub is a **full-stack MERN application** for uploading, searching, and managing memes.  
It’s a **public meme-sharing platform** where anyone can upload images, browse memes, and contribute to the project.  

👉 **Live link:** [https://memehub-m4gy.onrender.com/](https://memehub-m4gy.onrender.com/)  

---

## 🎯 Purpose  

The goal of MemeHub is to provide a **fun, open, and community-driven place** where:  
- Users can upload and explore memes.  
- Images are hosted securely on **Cloudinary**, while **MongoDB stores their URLs**.  
- Developers can **contribute freely** since the project is open-source.  

Anyone can raise issues, suggest improvements, or build new features. 🚀  

---

## 🚀 Tech Stack  

### 🌐 Frontend  
- **React** – UI framework  
- **Tailwind CSS** – styling  
- **Vite** – fast dev build tool  

### ⚙️ Backend  
- **Express.js + Node.js** – RESTful API server  
- **MongoDB (Mongoose)** – database for storing meme metadata & Cloudinary URLs  
- **Cloudinary** – stores uploaded images  
- **Multer** – file uploads middleware  

### ☁️ Hosting  
- **Render** – backend hosting  
- **Frontend deployed** via Render as well  

---

## 📂 Project Structure  

```
MemeHub/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # UI components (navbar, meme-card, etc.)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API utilities
│   │   └── pages/         # Pages (home, upload, admin-login, dashboard)
│   └── index.html
├── server/                # Express backend
│   ├── index.ts           # Entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # MongoDB + Cloudinary integration
│   └── vite.ts            # Dev config
├── shared/                # Shared schemas & types
│   └── schema.ts
├── package.json
└── tailwind.config.ts
```

---

## ⚡ Features  

### 👤 Users  
- Upload memes with **title, tags, and image**  
- **Search instantly** by title or tags  
- View memes in a **grid layout with pagination**  
- Mobile + desktop responsive  

### 🔑 Admin  
- Secure login (via env credentials)  
- Manage memes from a dashboard  
- Rename meme titles (PATCH)  
- Delete memes (DELETE)  

---

## 🤝 Contributing  

MemeHub is **open-source (MIT License)**.  
- 🐛 Report bugs via GitHub issues  
- 🔧 Submit pull requests with fixes/features  
- 💡 Share ideas to improve the platform  

---

## 📜 License  

This project is licensed under the **MIT License**.  
You’re free to use, modify, and distribute it.  

---

