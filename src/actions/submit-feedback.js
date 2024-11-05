"use server";

import { env } from "@/lib/env.mjs";
import axios from "axios";

export async function SubmitFeedback(formData) {
	const name = formData.get("name");
	const email = formData.get("email");
	const title = formData.get("title");
	const label = formData.get("label");
	const feedback = formData.get("feedback");

	try {
		await axios.post("https://projectplannerai.com/api/feedback", {
			projectId: env.PROJECT_PLANNER_AI_ID,
			name,
			email,
			title,
			label,
			feedback,
		});

		return { success: true, message: "Feedback submitted successfully" };
	} catch (error) {
		console.error("Error submitting feedback:", error);
		return { success: false, message: "Error submitting feedback" };
	}
}
