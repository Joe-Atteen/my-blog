/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabase image configuration
  images: {
    remotePatterns: [
      // URL format without 'public'
      {
        protocol: "https",
        hostname: "znphqmblusltnxhsbdnt.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "znphqmblusltnxhsbdnt.supabase.in",
        pathname: "/storage/v1/object/**",
      },
      // Legacy URL format with 'public' (for backward compatibility)
      {
        protocol: "https",
        hostname: "znphqmblusltnxhsbdnt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "znphqmblusltnxhsbdnt.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // More generic patterns for any Supabase project
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/**",
      },
      // Legacy patterns (for backward compatibility)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // Allow direct download URLs with token
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/sign/**",
      },
      // Fallback to placeholder image services if needed
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
    // Add dangerously allow SVG for placeholder fallbacks
    dangerouslyAllowSVG: true,
    // Optimize content type detection
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Increase the image limit size (default 4MB)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
  },

  // Webpack configuration to suppress Supabase Realtime critical dependency warnings
  webpack: (config, { isServer }) => {
    // Method 1: Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      {
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    // Method 2: Add a specific rule for the problematic module
    if (!config.module) {
      config.module = { rules: [] };
    }

    // Add a specific rule that uses "null-loader" for the problematic module in client-side build
    if (!isServer) {
      config.module.rules.push({
        test: /node_modules\/@supabase\/realtime-js\/dist\/main\/RealtimeClient\.js$/,
        use: "null-loader",
        include: /node_modules/,
      });
    }

    return config;
  },
};

export default nextConfig;
