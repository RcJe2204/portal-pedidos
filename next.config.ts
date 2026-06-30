import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/admin/dashboard",
        permanent: true,
      },
      {
        source: "/pedidos",
        destination: "/admin/pedidos",
        permanent: true,
      },
      {
        source: "/produtos",
        destination: "/admin/produtos",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;