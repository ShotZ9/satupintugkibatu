import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerDir: "worker",
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {}, // wajib di Next 16
};

export default withPWA(nextConfig);