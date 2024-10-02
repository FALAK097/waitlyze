import { env } from "@/lib/env.mjs";
import { createUser, deleteUser, updateUser } from "@/lib/users";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req) {
	const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		throw new Error(
			"Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
		);
	}

	// Get the headers
	const headerPayload = headers();
	const svix_id = headerPayload.get("svix-id");
	const svix_timestamp = headerPayload.get("svix-timestamp");
	const svix_signature = headerPayload.get("svix-signature");

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new NextResponse("Error occurred -- no svix headers", {
			status: 400,
		});
	}

	// Get the body
	const payload = await req.json();
	const body = JSON.stringify(payload);

	// Create a new Svix instance with your secret.
	const wh = new Webhook(WEBHOOK_SECRET);

	let evt;

	// Verify the payload with the headers
	try {
		evt = wh.verify(body, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature,
		});
	} catch (err) {
		console.error("Error verifying webhook:", err);
		return new NextResponse("Error occurred", {
			status: 400,
		});
	}

	const eventType = evt.type;

	if (eventType === "user.created") {
		const { id, email_addresses, first_name, last_name, image_url } = evt.data;

		if (!id || !email_addresses) {
			return new NextResponse("Error occurred -- missing data", {
				status: 400,
			});
		}

		const user = {
			clerkUserId: id,
			email: email_addresses[0].email_address,
			...(first_name ? { firstName: first_name } : {}),
			...(last_name ? { lastName: last_name } : {}),
			...(image_url ? { imageUrl: image_url } : {}),
		};

		await createUser(user);
	} else if (eventType === "user.updated") {
		const { id, email_addresses, first_name, last_name, image_url } = evt.data;

		if (!id) {
			return new NextResponse("Error occurred -- missing user ID", {
				status: 400,
			});
		}

		const updatedData = {
			...(email_addresses ? { email: email_addresses[0].email_address } : {}),
			...(first_name ? { firstName: first_name } : {}),
			...(last_name ? { lastName: last_name } : {}),
			...(image_url ? { imageUrl: image_url } : {}),
		};

		await updateUser(id, updatedData);
	} else if (eventType === "user.deleted") {
		const { id } = evt.data;

		if (!id) {
			return new NextResponse("Error occurred -- missing user ID", {
				status: 400,
			});
		}

		await deleteUser({ clerkUserId: id });
	}

	return new NextResponse({ status: 200 });
}
