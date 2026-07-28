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
     * WebP only — Next's default, and deliberately left alone.
     *
     * AVIF was tried here and measured: on the Industries artwork it is about
     * 27% smaller (50KB against 69KB at 1200px) but takes roughly a hundred
     * times longer to encode — 20 seconds per variant against 0.2. Those
     * images lazy-load, so the first visitor to reach an uncached size would
     * watch an empty plate for twenty seconds while scrolling, to save 19KB.
     * With eight images across six widths that is 48 variants each capable of
     * stalling once. Not a trade worth making.
     *
     * The source PNGs are 1.7-2MB and are never touched; WebP alone still
     * takes the section from about 15MB to under 600KB.
     */
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
