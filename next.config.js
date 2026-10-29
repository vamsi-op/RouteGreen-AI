const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this project to avoid Next.js inferring a
  // parent directory when stray lockfiles exist higher up the tree.
  outputFileTracingRoot: path.join(__dirname),
  
  // Suppress hydration warnings caused by browser extensions
  // WARNING: This will also hide legitimate hydration issues
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

module.exports = nextConfig;
