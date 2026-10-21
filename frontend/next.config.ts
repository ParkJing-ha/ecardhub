import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.160"],
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
