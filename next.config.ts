import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",

  /**
   * Declare the `page` cache profile used by `cacheLife("page")` directives.
   *
   * Next 16 moved `cacheLife` OUT of `experimental` (top-level). The deploys
   * that invoked `cacheLife("page")` without this declaration surfaced:
   *   ⨯ Error: Invalid profile provided "page" must be configured under
   *     cacheLife in next.config or be "max"
   */
  cacheLife: {
    page: {
      stale: 15,
      revalidate: 60,
      expire: 3600,
    },
  },
};

export default nextConfig;