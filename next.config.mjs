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
};

export default nextConfig;
