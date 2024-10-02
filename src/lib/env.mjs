import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		POSTGRES_URL: z.string().min(1),
		NODE_ENV: z.string().min(1),
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
		CLERK_SECRET_KEY: z.string().min(1),
	},
	client: {},
	runtimeEnv: {
		POSTGRES_URL: process.env.POSTGRES_URL,
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
	},
});
