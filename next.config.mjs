import CopyWebpackPlugin from "copy-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
				port: "",
			},
			{
				protocol: "https",
				hostname: "utfs.io",
				port: "",
			},
			{
				protocol: "https",
				hostname: "picsum.photos",
				port: "",
			},
		],
	},
	experimental: {
		serverComponentsExternalPackages: ["geoip-lite"],
		outputFileTracingIncludes: {
			"geoip-lite": [
				"geoip-lite/data/geoip-country.dat",
				"geoip-lite/data/geoip-country6.dat",
				"geoip-lite/data/geoip-city.dat",
				"geoip-lite/data/geoip-city6.dat",
				"geoip-lite/data/geoip-city-names.dat",
				"geoip-lite/data/city.checksum",
				"geoip-lite/data/country.checksum",
			],
		},
	},
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.plugins.push(
				new CopyWebpackPlugin({
					patterns: [
						{
							from: "node_modules/geoip-lite/data/geoip-country.dat",
							to: "data/geoip-country.dat",
						},
						{
							from: "node_modules/geoip-lite/data/geoip-country6.dat",
							to: "data/geoip-country6.dat",
						},
						{
							from: "node_modules/geoip-lite/data/geoip-city.dat",
							to: "data/geoip-city.dat",
						},
						{
							from: "node_modules/geoip-lite/data/geoip-city6.dat",
							to: "data/geoip-city6.dat",
						},
						{
							from: "node_modules/geoip-lite/data/geoip-city-names.dat",
							to: "data/geoip-city-names.dat",
						},
						{
							from: "node_modules/geoip-lite/data/city.checksum",
							to: "data/city.checksum",
						},
						{
							from: "node_modules/geoip-lite/data/country.checksum",
							to: "data/country.checksum",
						},
					],
				}),
			);
		}
		return config;
	},
};

export default nextConfig;
