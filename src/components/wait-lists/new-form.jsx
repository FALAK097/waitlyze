"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Textarea } from "../ui/textarea";
import UploadImage from "../upload-image";

export const NewWaitListForm = ({ createNewWaitList }) => {
	const [projectName, setProjectName] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [description, setDescription] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const logoKeyRef = useRef("");
	const [loading, setLoading] = useState(false);
	const [isCreated, setIsCreated] = useState(false);
	const { push } = useRouter();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!projectName) return toast.error("Please enter a project name");
		setLoading(true);
		const response = await createNewWaitList({
			name: projectName,
			websiteUrl,
			description,
			logoUrl: logoUrl || "",
			logoKey: logoUrl ? logoKeyRef.current : "",
		});

		if (response.success) {
			setIsCreated(true);
			setLoading(false);
			toast.success(response.message);
			console.log(response);
			setTimeout(() => {
				push(`/wait-lists/${response.waitList.id}/edit`);
			}, 1000);
		} else {
			setLoading(false);
			toast.error("There was an error creating the wait list");
		}
	};

	return (
		<div className="flex min-h-[80vh] w-full justify-center items-center">
			<div>
				<Card className="max-w-md mx-auto">
					<CardHeader>
						<CardTitle className="text-3xl font-bold">
							Let&apos;s start with{" "}
							<span className="text-primary">the basics</span>
						</CardTitle>
						<CardDescription className="text-gray-600">
							Fill in the details below to create your new waitlist
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="projectName" className="text-lg font-semibold">
									Waitlist Name
								</Label>
								<Input
									id="projectName"
									value={projectName}
									onChange={(e) => setProjectName(e.target.value)}
									placeholder="Waitlyze"
									required
									disabled={loading || isCreated}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description" className="text-lg font-semibold">
									Description{" "}
									<span className="text-sm text-muted-foreground">
										(Optional)
									</span>
								</Label>
								<Textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Explains what your project is about"
									disabled={loading || isCreated}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="websiteUrl" className="text-lg font-semibold">
									Website URL{" "}
									<span className="text-sm text-muted-foreground">
										(Optional)
									</span>
								</Label>
								<div className="relative">
									<Input
										id="websiteUrl"
										value={websiteUrl}
										onChange={(e) => setWebsiteUrl(e.target.value)}
										placeholder="waitlyze.falakgala.dev"
										disabled={loading || isCreated}
										className="peer ps-16"
										type="text"
									/>
									<span className="absolute inset-y-0 flex items-center justify-center text-sm pointer-events-none start-0 ps-3 text-muted-foreground peer-disabled:opacity-50">
										https://
									</span>
								</div>
							</div>
							<div>
								<Label htmlFor="logo" className="text-lg font-semibold">
									Logo <span className="text-sm text-muted-foreground">(Optional)</span>
								</Label>
								<UploadImage
									value={logoUrl}
									onSuccess={(files) => {
										setLogoUrl(files[0].url);
										logoKeyRef.current = files[0].key;
									}}
									onClear={() => {
										setLogoUrl("");
										logoKeyRef.current = "";
									}}
									disabled={loading || isCreated}
								/>
							</div>
							<Button
								type="submit"
								className="w-full py-4 mt-6 text-md"
								disabled={loading || isCreated}
							>
								{loading
									? "Creating..."
									: isCreated
										? "Created!"
										: "Create WaitList"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
