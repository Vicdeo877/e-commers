/**
 * Hostinger Custom Server Entry Point
 * This shim allows Next.js 'standalone' builds to run on Hostinger's Node.js selector.
 */
const path = require('path');

// Manually set environment variables if .env isn't loaded automatically
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 3000;
process.env.HOSTNAME = '0.0.0.0';

// Require the standalone server
require('./.next/standalone/server.js');
