/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { useTypeScriptCli: true },

  /**
   * Dev-only. Next blocks /_next/* dev resources (HMR socket, dev assets) from
   * any origin other than localhost, so the page loads over the LAN but never
   * hydrates — which reads as "the site is broken on my phone".
   *
   * Listing the machine's LAN address and its .local name lets real devices on
   * the same Wi-Fi load it properly. This has no effect on production builds.
   * If the router hands out a new DHCP lease, update the IP here.
   */
  allowedDevOrigins: ['192.168.0.151', '*.local'],

  images: {
    /**
     * AVIF first, WebP as the fallback. The Industries artwork is eight
     * 1.7-2MB PNGs; served through the optimiser one of them lands at about
     * 32KB, so this is the difference between a 15MB section and a 300KB one.
     * The source files are never touched.
     */
    formats: ['image/avif', 'image/webp'],
    /**
     * Next 16 only permits qualities listed here, and defaults to [75] alone.
     * The mockups contain real interface text — navigation labels, feature
     * rows — which is the first thing to go soft under compression, so they
     * are served at 82. Everything else on the site stays at the default.
     */
    qualities: [75, 82],
  },
};

export default nextConfig;
