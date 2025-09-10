# Overview

MemeHub is a full-stack MERN application for uploading, searching, and managing memes. It's a public meme-sharing platform where users can upload images, browse memes through a responsive grid layout, and search for content by title or tags. The application features admin capabilities for meme management and uses a modern tech stack with React/Vite frontend and Express.js backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with Vite**: Modern development setup for fast builds and hot reloading
- **TypeScript**: Full type safety across the application
- **Tailwind CSS + shadcn/ui**: Utility-first styling with pre-built components for consistent UI
- **React Query (@tanstack/react-query)**: Server state management with caching, background updates, and optimistic updates
- **Wouter**: Lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Express.js + Node.js**: RESTful API server with TypeScript
- **Dual Database Support**: 
  - MongoDB with Mongoose for current implementation (production)
  - PostgreSQL with Drizzle ORM configured for potential migration
- **File Upload Pipeline**: Multer middleware → Cloudinary storage
- **API Design**: RESTful endpoints with proper error handling and validation

## Database Schema Design
The application uses a simple meme entity structure:
- **id**: Unique identifier (UUID)
- **title**: Meme title/caption
- **tags**: Array of searchable tags
- **imageUrl**: Cloudinary-hosted image URL
- **createdAt**: Timestamp for sorting

Both MongoDB and PostgreSQL schemas are defined for flexibility, with MongoDB currently active.

## Authentication & Authorization
- **Simple Admin System**: Environment variable-based admin credentials
- **Local Storage**: Session persistence for admin state
- **Protected Routes**: Client-side route protection for admin dashboard
- **No User Registration**: Public platform with admin-only management features

## Image Storage Strategy
- **Cloudinary Integration**: Free tier cloud storage for images
- **Multer Processing**: Server-side file upload handling with validation
- **Direct Download Links**: Cloudinary URLs with fl_attachment transformation for reliable downloads across all devices
- **Orphan Cleanup**: Script for removing unused Cloudinary assets

## State Management
- **React Query**: Server state caching and synchronization
- **Local State**: React hooks for component-level state
- **URL State**: Search parameters reflected in URL for bookmarkable searches

## Performance Optimizations
- **Responsive Images**: Cloudinary automatic optimization
- **Lazy Loading**: Grid-based meme loading with pagination
- **Client-side Caching**: React Query cache invalidation strategies
- **Mobile-first Design**: Progressive enhancement for larger screens

# External Dependencies

## Core Services
- **Cloudinary**: Image hosting and transformation service
- **MongoDB Atlas**: Cloud database (current)
- **Render**: Application hosting platform
- **Neon/PostgreSQL**: Alternative database option (configured but not active)

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type checking and development experience
- **ESLint/Prettier**: Code quality and formatting
- **Drizzle Kit**: Database migration tools for PostgreSQL

## UI Component Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component system
- **Tailwind CSS**: Utility-first CSS framework

## File Upload & Processing
- **Multer**: Multipart form data handling
- **Multer Storage Cloudinary**: Direct upload to Cloudinary
- **File Type Validation**: Image format restrictions (PNG, JPG, GIF, WebP)

## API & HTTP Client
- **Fetch API**: Native HTTP requests
- **React Query**: Server state management with built-in caching
- **Zod**: Runtime type validation for API responses

## Build & Deployment
- **esbuild**: Server-side bundling for production
- **PostCSS**: CSS processing with Autoprefixer
- **Environment Variables**: Configuration management for different environments