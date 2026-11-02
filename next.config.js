const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  serverExternalPackages: ['mongodb', 'mysql2'],
  outputFileTracingRoot: path.join(__dirname),
};
