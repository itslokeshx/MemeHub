

> Build me a **complete MERN stack application** called **MemeHub** where users can upload, search, and download memes.
> The output must include:
>
> 1. **Full application code** (backend + frontend).
> 2. **Folder structure** (`backend`, `frontend`).
> 3. **Step-by-step guide** to run locally.
> 4. **Step-by-step guide** to host for free (Vercel + Render + MongoDB Atlas + Cloudinary).
>
> ## 🚀 App Features
>
> 1. **Upload Meme**
>
>    * Users upload image + provide title + tags (comma-separated).
>    * Store image in **Cloudinary (free tier)**.
>    * Save metadata (`title`, `tags`, `imageUrl`, `createdAt`) in **MongoDB Atlas**.
> 2. **View Memes**
>
>    * Homepage grid layout with meme cards.
>    * Card shows: image, title, tags, download button.
>    * Pagination or infinite scroll.
> 3. **Search**
>
>    * Search bar filters memes by **title/tags**.
>    * Backend must support query param (`GET /api/memes?search=keyword`).
> 4. **Download**
>
>    * Download button fetches Cloudinary-hosted image.
> 5. **Dark Theme UI**
>
>    * Color Palette:
>
>      * Background: `#121212`
>      * Cards: `#1e1e1e`
>      * Accent: `#e63946`
>      * Secondary Accent: `#457b9d`
>      * Text: `#f1faee`
>    * Use **TailwindCSS** for styling.
>    * Responsive: mobile (2 cols), tablet (3 cols), desktop (4–5 cols).
>
> ---
>
> ## ⚙️ Backend (Node + Express)
>
> * Dependencies: `express`, `mongoose`, `cors`, `dotenv`, `multer`, `cloudinary`, `multer-storage-cloudinary`.
> * Routes:
>
>   * `POST /api/memes` → Upload meme.
>   * `GET /api/memes` → Fetch memes (with optional search + pagination).
>   * `GET /api/memes/:id` → Get single meme.
> * Mongoose Schema:
>
>   ```js
>   const MemeSchema = new mongoose.Schema({
>     title: String,
>     tags: [String],
>     imageUrl: String,
>     createdAt: { type: Date, default: Date.now }
>   });
>   ```
> * Use `.env` for secrets:
>
>   ```
>   MONGO_URI=
>   CLOUD_NAME=
>   CLOUD_API_KEY=
>   CLOUD_API_SECRET=
>   ```
>
> ---
>
> ## 🎨 Frontend (React + Tailwind)
>
> * Pages:
>
>   * `/` → Homepage with meme grid + search bar.
>   * `/upload` → Upload form.
>   * `/meme/:id` → Optional single meme view.
> * Components:
>
>   * `Navbar` (logo + search + upload button).
>   * `MemeGrid` (displays memes).
>   * `MemeCard` (title, tags, image, download button).
>   * `UploadForm` (form with file input + title + tags).
> * Use **Axios** for API calls.
> * Responsive grid layout with hover effects.
>
> ---
>
> ## ☁️ Cloudinary Setup
>
> * Install: `npm install cloudinary multer multer-storage-cloudinary`.
> * Config:
>
>   ```js
>   cloudinary.config({
>     cloud_name: process.env.CLOUD_NAME,
>     api_key: process.env.CLOUD_API_KEY,
>     api_secret: process.env.CLOUD_API_SECRET
>   });
>   ```
> * Store images in `memes/` folder.
>
> ---
>
> ## 🗄️ MongoDB Atlas Setup
>
> * Create free cluster.
> * Copy connection string.
> * Replace `<password>` with your DB user password.
> * Add to `.env` as `MONGO_URI`.
> * Create index on `title` + `tags` for search optimization.
>
> ---
>
> ## 🖥️ Local Setup Guide
>
> 1. Clone project.
> 2. Install backend dependencies:
>
>    ```bash
>    cd backend
>    npm install
>    npm start
>    ```
> 3. Install frontend dependencies:
>
>    ```bash
>    cd frontend
>    npm install
>    npm start
>    ```
> 4. Backend runs on `http://localhost:5000`, frontend on `http://localhost:3000`.
>
> ---
>
> ## 🌐 Free Hosting Guide
>
> ### 1. **Database (MongoDB Atlas)**
>
> * Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas).
> * Create free cluster.
> * Add your IP as `0.0.0.0/0` (allow all).
> * Get connection string → Add to backend `.env`.
>
> ### 2. **Image Hosting (Cloudinary)**
>
> * Go to [https://cloudinary.com](https://cloudinary.com).
> * Create free account.
> * Get `cloud_name`, `api_key`, `api_secret`.
> * Add to backend `.env`.
>
> ### 3. **Backend Hosting (Render)**
>
> * Push backend code to GitHub.
> * Go to [https://render.com](https://render.com).
> * Create new Web Service → Connect GitHub repo.
> * Add environment variables (`MONGO_URI`, `CLOUD_NAME`, etc.).
> * Set start command: `node server.js`.
> * Deploy → Get backend URL (e.g., `https://memehub-api.onrender.com`).
>
> ### 4. **Frontend Hosting (Vercel)**
>
> * Push frontend code to GitHub.
> * Go to [https://vercel.com](https://vercel.com).
> * Import repo.
> * Add `REACT_APP_API_URL=https://memehub-api.onrender.com` in settings.
> * Deploy → Get frontend URL (e.g., `https://memehub.vercel.app`).
>
> ✅ Final Setup:
>
> * Frontend: `https://memehub.vercel.app`
> * Backend: `https://memehub-api.onrender.com`
> * Database: MongoDB Atlas
> * Images: Cloudinary

