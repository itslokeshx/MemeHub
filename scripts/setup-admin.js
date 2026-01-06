#!/usr/bin/env node
/**
 * Admin Setup Script
 * 
 * This script creates the first admin account for MemeHub.
 * Run this script once to set up your admin credentials.
 * 
 * Usage: node scripts/setup-admin.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupAdmin() {
    try {
        // Connect to MongoDB
        if (!process.env.MONGODB_URI) {
            console.error('Error: MONGODB_URI not found in environment variables');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin collection exists
        const AdminModel = mongoose.model('Admin', new mongoose.Schema({
            id: String,
            username: String,
            passwordHash: String,
            role: String,
            createdAt: Date
        }));

        const existingAdmins = await AdminModel.countDocuments();
        if (existingAdmins > 0) {
            console.log(`\nFound ${existingAdmins} existing admin(s).`);
            const proceed = await question('Do you want to create another admin? (yes/no): ');
            if (proceed.toLowerCase() !== 'yes') {
                console.log('Setup cancelled.');
                process.exit(0);
            }
        }

        // Get admin credentials
        console.log('\n=== Create Admin Account ===\n');
        const username = await question('Enter admin username (min 3 characters): ');

        if (username.length < 3) {
            console.error('Error: Username must be at least 3 characters');
            process.exit(1);
        }

        // Check if username exists
        const existingUser = await AdminModel.findOne({ username });
        if (existingUser) {
            console.error('Error: Username already exists');
            process.exit(1);
        }

        const password = await question('Enter admin password (min 6 characters): ');

        if (password.length < 6) {
            console.error('Error: Password must be at least 6 characters');
            process.exit(1);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create admin
        const admin = new AdminModel({
            id: randomUUID(),
            username,
            passwordHash,
            role: 'admin',
            createdAt: new Date()
        });

        await admin.save();

        console.log('\n✅ Admin account created successfully!');
        console.log(`Username: ${username}`);
        console.log('\nYou can now login at /api/admin/login');
        console.log('\nSetup complete!');

    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    } finally {
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
    }
}

setupAdmin();
