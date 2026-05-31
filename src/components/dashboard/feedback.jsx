"use client";

import { SubmitFeedback } from "@/actions/submit-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { MessageCircleMoreIcon } from "../shared/icons";

const feedbackSchema = z.object({
	name: z.string().min(1, "Name is required").max(40, "Name is too long"),
	email: z.string().email("Invalid email address"),
	title: z.string().min(1, "Title is required").max(40, "Title is too long"),
	label: z.enum([
		"idea",
		"issue",
		"question",
		"complaint",
		"featureRequest",
		"other",
	]),
	feedback: z
		.string()
		.min(10, "Feedback must be at least 10 characters long")
		.max(300, "Feedback is too long"),
});

export const Feedback = () => {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { data: session } = useSession();
	const user = session?.user;
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(feedbackSchema),
		defaultValues: {
			name: "",
			email: "",
			title: "",
			label: "featureRequest",
			feedback: "",
		},
	});

	useEffect(() => {
		if (user?.email) {
			setValue("email", user.email);
		}
		if (user?.name) {
			setValue("name", user.name);
		} else if (user?.firstName) {
			setValue("name", `${user.firstName} ${user.lastName || ""}`.trim());
		}
	}, [user, setValue]);

	const onSubmit = async (data) => {
		setIsLoading(true);
		const formData = new FormData();
		for (const [key, value] of Object.entries(data)) {
			formData.append(key, value);
		}
		try {
			const result = await SubmitFeedback(formData);
			if (result.success) {
				toast.success(result.message);
				setOpen(false);
				reset();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TooltipProvider>
			<Sheet open={open} onOpenChange={setOpen}>
				<Tooltip delayDuration={0}>
					<TooltipTrigger asChild>
						<SheetTrigger asChild>
							<button type="button" className="text-secondary-foreground" onClick={() => setOpen(true)}>
								<MessageCircleMoreIcon />
							</button>
						</SheetTrigger>
					</TooltipTrigger>
					<TooltipContent>
						<p>Feedback</p>
					</TooltipContent>
				</Tooltip>
				<SheetContent className="sm:max-w-[425px] overflow-y-scroll no-scrollbar">
					<SheetHeader>
						<SheetTitle>Feedback</SheetTitle>
						<SheetDescription>
							We value your feedback. How can we improve your experience?
						</SheetDescription>
					</SheetHeader>
					<form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Controller
								name="name"
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										placeholder="Your name"
										className="rounded-xl"
										disabled={!!(user?.name || user?.firstName)}
									/>
								)}
							/>
							{errors.name && (
								<p className="text-sm text-red-500">{errors.name.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Controller
								name="email"
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										type="email"
										placeholder="your.email@example.com"
										className="rounded-xl"
										disabled={!!user?.email}
									/>
								)}
							/>
							{errors.email && (
								<p className="text-sm text-red-500">{errors.email.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Controller
								name="title"
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										placeholder="I love your application"
										className="rounded-xl"
									/>
								)}
							/>
							{errors.title && (
								<p className="text-sm text-red-500">{errors.title.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="label">Label</Label>
							<Controller
								name="label"
								control={control}
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select a label" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="idea">Idea</SelectItem>
											<SelectItem value="issue">Issue</SelectItem>
											<SelectItem value="question">Question</SelectItem>
											<SelectItem value="complaint">Complaint</SelectItem>
											<SelectItem value="featureRequest">
												Feature Request
											</SelectItem>
											<SelectItem value="other">Other</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.label && (
								<p className="text-sm text-red-500">{errors.label.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="feedback">Feedback</Label>
							<Controller
								name="feedback"
								control={control}
								render={({ field }) => (
									<Textarea
										{...field}
										placeholder="I really enjoy your application"
										className="h-32 rounded-xl"
									/>
								)}
							/>
							{errors.feedback && (
								<p className="text-sm text-red-500">
									{errors.feedback.message}
								</p>
							)}
						</div>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader className="mr-2 w-4 h-4 animate-spin" />
									Submitting...
								</>
							) : (
								"Thanks for your feedback!"
							)}
						</Button>
					</form>
				</SheetContent>
			</Sheet>
		</TooltipProvider>
	);
};
