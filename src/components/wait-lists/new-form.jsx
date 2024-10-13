"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";

export const NewWaitListForm = ({ createNewWaitList }) => {
	const [projectName, setProjectName] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [isCreated, setIsCreated] = useState(false);
	const { push } = useRouter();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		const response = await createNewWaitList({
			name: projectName,
			websiteUrl,
		});

		if (response.success) {
			setIsCreated(true);
			setLoading(false);
			toast.success(response.message);
			setTimeout(() => {
				push(`/wait-lists/${response.waitList.id}`);
			}, 1000);
		}
	};

	return (
		<div className="flex min-h-[80vh] w-full justify-center items-center">
			<div>
				<Card className="max-w-md mx-auto">
					<CardHeader>
						<CardTitle className="text-3xl font-bold mb-6">
							Let&apos;s start with{" "}
							<span className="text-primary">the basics</span>
						</CardTitle>
						<CardDescription className="mb-6 text-gray-600">
							Fill in your details below. Skip the Website URL field if you
							don&apos;t have a website
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<Label htmlFor="projectName" className="text-lg font-semibold">
									Wait List Name
								</Label>
								<Input
									id="projectName"
									value={projectName}
									onChange={(e) => setProjectName(e.target.value)}
									placeholder="HypeItUp"
									required
									disabled={loading || isCreated}
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
									placeholder="https://www.hypeitup.com"
									type="url"
									disabled={loading || isCreated}
								/>
							</div>
							<Button
								type="submit"
								className="w-full text-md py-4 mt-6"
								disabled={loading || isCreated}
							>
								{loading
									? "Creating..."
									: isCreated
										? "Created!"
										: "Create Wait List"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
