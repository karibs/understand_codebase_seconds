/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@std/testing/mock'] = false;
    config.resolve.alias['@std/testing/bdd'] = false;
    return config;
  },
};

export default nextConfig;
