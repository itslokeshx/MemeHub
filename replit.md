# MemeHub

## Overview

MemeHub is a full-stack meme sharing platform built with a React frontend and Express.js backend. Users can upload, search, browse, and download memes in a responsive dark-themed interface. The application features a grid-based layout for meme discovery, comprehensive search functionality, and seamless file upload capabilities with cloud storage integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with a custom dark theme configuration
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Upload**: Multer for handling multipart form data
- **API Design**: RESTful endpoints with structured error handling
- **Storage Strategy**: In-memory storage with interface for database implementation

### Data Storage Solutions
- **Primary Database**: PostgreSQL configured through Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **File Storage**: Cloudinary integration for image hosting and management

### Authentication and Authorization
- **Session Management**: PostgreSQL session store (connect-pg-simple)
- **Security**: CORS enabled for cross-origin requests
- **File Validation**: Server-side file type and size validation

### Key Features
- **Image Upload**: Drag-and-drop file upload with preview functionality
- **Search System**: Real-time search across meme titles and tags
- **Responsive Design**: Mobile-first approach with grid layouts (2/3/4-5 columns)
- **Download Functionality**: Direct download of memes from cloud storage
- **Pagination**: Efficient data loading with offset-based pagination
- **Error Handling**: Comprehensive error boundaries and user feedback

## External Dependencies

### Cloud Services
- **Cloudinary**: Image hosting, transformation, and CDN delivery
- **Neon Database**: Serverless PostgreSQL database hosting

### Core Libraries
- **UI Components**: Radix UI primitives for accessible component foundation
- **Validation**: Zod for runtime type checking and schema validation
- **HTTP Client**: Native fetch API with TanStack Query for caching
- **File Processing**: Multer with Cloudinary storage adapter
- **Date Utilities**: date-fns for date formatting and manipulation

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: ESBuild for production bundling
- **CSS Processing**: PostCSS with TailwindCSS and Autoprefixer
- **Development Experience**: Replit-specific plugins for runtime error handling