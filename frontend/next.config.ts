import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.159"],
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
