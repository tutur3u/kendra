import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	devIndicators: false,
	images: {
		remotePatterns: [
			{
				hostname: "tuturuuu.com",
				pathname: "/api/v1/**",
				protocol: "https",
			},
			{
				hostname: "cms.tuturuuu.com",
				pathname: "/**",
				protocol: "https",
			},
			{
				hostname: "localhost",
				pathname: "/api/v1/**",
				port: "7803",
				protocol: "http",
			},
		],
	},
	partialPrefetching: true,
};

export default nextConfig;
