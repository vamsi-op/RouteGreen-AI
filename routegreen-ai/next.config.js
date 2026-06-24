const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this project to avoid Next.js inferring a
  // parent directory when stray lockfiles exist higher up the tree.
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
