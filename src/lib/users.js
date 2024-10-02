import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function createUser(data) {
	try {
		const user = await prisma.user.create({ data });
		return NextResponse.json({ user });
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function updateUser(clerkUserId, data) {
	try {
		const existingUser = await prisma.user.findUnique({
			where: { clerkUserId },
		});

		if (!existingUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const user = await prisma.user.update({
			where: { clerkUserId },
			data,
		});
		return NextResponse.json({ user });
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function deleteUser({ clerkUserId }) {
	try {
		const existingUser = await prisma.user.findUnique({
			where: { clerkUserId },
		});

		if (!existingUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		await prisma.user.delete({ where: { clerkUserId } });

		return NextResponse.json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Error deleting user:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
