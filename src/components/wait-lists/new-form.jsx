"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const NewWaitListForm = ({ createNewWaitList }) => {
	const [projectName, setProjectName] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const { push } = useRouter();

	const handleSubmit = async (e) => {
		e.preventDefault();
		const response = await createNewWaitList({
			name: projectName,
			websiteUrl,
		});

		if (response.success) {
			push(`/wait-lists/${response.waitList.id}`);
		}
	};

	return (
		<div className="max-w-md mx-auto p-6 rounded-lg shadow-md">
			<h1 className="text-3xl font-bold mb-6">
				First, let&apos;s get{" "}
				<span className="text-purple-500">the basics</span>
			</h1>
			<p className="mb-6 text-gray-600">
				Fill in your project details below. Skip the Website URL field if you
				don&apos;t have a website
			</p>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Label htmlFor="projectName" className="text-lg font-semibold">
						Project Name
					</Label>
					<Input
						id="projectName"
						value={projectName}
						onChange={(e) => setProjectName(e.target.value)}
						placeholder="Waitforit"
						className="mt-1 text-lg p-3 h-auto"
						required
					/>
				</div>
				<div>
					<Label htmlFor="websiteUrl" className="text-lg font-semibold">
						Website URL
					</Label>
					<Input
						id="websiteUrl"
						value={websiteUrl}
						onChange={(e) => setWebsiteUrl(e.target.value)}
						placeholder="https://www.waitforit.me"
						className="mt-1 text-lg p-3 h-auto"
						type="url"
					/>
				</div>
				<Button
					type="submit"
					className="w-full text-lg py-6 mt-6 bg-gray-200 text-gray-800 hover:bg-gray-300"
				>
					Create Project
				</Button>
			</form>
		</div>
	);
};
