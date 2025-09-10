# MemeHub - Local Setup Instructions

## What's Included
This package contains the complete MemeHub application with all source code, configuration files, and dependencies list.

## Prerequisites
Before running locally, make sure you have:
- Node.js (v18 or higher)
- npm or yarn package manager
- MongoDB database (local or cloud)
- Cloudinary account for image storage

## Setup Steps

1. **Extract the files:**
   ```bash
   tar -xzf memehub-complete.tar.gz
   cd memehub-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   VITE_ADMIN_USERNAME=admin
   VITE_ADMIN_PASSWORD=your_admin_password
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open your browser to `http://localhost:5000`
   - The app will serve both frontend and backend on the same port

## Features Included
- Complete MERN stack application
- React frontend with TypeScript
- Express.js backend with MongoDB
- Cloudinary image storage integration
- Admin dashboard for meme management
- Responsive design with Tailwind CSS
- Download functionality for memes
- Search and tag system

## File Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas
- `package.json` - Dependencies and scripts
- Configuration files for Vite, Tailwind, TypeScript

Enjoy your local MemeHub installation!