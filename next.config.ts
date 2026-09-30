import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Gera um servidor enxuto para a imagem Docker (a Vercel ignora esta opção).
  output: 'standalone',
};

export default nextConfig;
