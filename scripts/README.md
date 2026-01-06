# Scripts Directory

This directory contains utility scripts for managing the MemeHub platform.

## Available Scripts

### `setup-admin.js`
**Purpose**: Create admin accounts for the platform

**Usage**:
```bash
node scripts/setup-admin.js
```

**What it does**:
- Prompts for username and password
- Hashes the password with bcrypt
- Creates admin account in MongoDB
- Validates credentials before saving

**When to use**:
- Initial setup (create first admin)
- Adding additional admin users

---

### `cleanup-cloudinary-orphans.js`
**Purpose**: Remove orphaned images from Cloudinary that are no longer in the database

**Usage**:
```bash
node scripts/cleanup-cloudinary-orphans.js
```

**What it does**:
- Fetches all meme records from MongoDB
- Lists all images in Cloudinary's 'memes/' folder
- Identifies images not referenced in the database
- Deletes orphaned images to save storage

**When to use**:
- After bulk deletions
- Periodic maintenance
- Before billing cycles to reduce storage costs

---

## Notes

- All scripts require `.env` file with proper configuration
- Scripts connect to production database - use with caution
- Always backup before running cleanup scripts
