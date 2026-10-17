import type { NextConfig } from "next";

function getPort(): string | undefined {
  if (process.env.PORT) return process.env.PORT;
  const pIndex = process.argv.indexOf("-p");
  if (pIndex !== -1 && process.argv[pIndex + 1]) {
    return process.argv[pIndex + 1];
  }
  const portIndex = process.argv.indexOf("--port");
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    return process.argv[portIndex + 1];
  }
  return undefined;
}

const currentPort = getPort();

const nextConfig: NextConfig = {
  distDir: currentPort ? `.next_${currentPort}` : ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.infrastructureLogging = {
      level: "error",
    };
    return config;
  },
};

export default nextConfig;

