"use client";

import { Icons } from "@/components/shared/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
	email: z.string().email("Invalid email address"),
});

export default function LoginComponent() {
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
	});

	return (
		<div className="flex items-center justify-center min-h-screen bg-background">
			<div className="w-full max-w-md p-8 space-y-8 rounded-lg shadow-lg bg-card">
				<Link
					href="/"
					className="inline-flex items-center text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</Link>
				<div className="text-center">
					<h2 className="text-3xl font-bold text-primary">Welcome</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Sign in or create an account
					</p>
				</div>
				<form className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="email">Email address</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							required
							className="w-full"
							placeholder="Enter your email"
							{...register("email")}
						/>
						{errors.email && (
							<p className="text-sm text-destructive">{errors.email.message}</p>
						)}
					</div>
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Processing..." : "Continue with Email"}
					</Button>
				</form>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-border" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="px-2 bg-card text-muted-foreground">
							Or continue with
						</span>
					</div>
				</div>
				<button
					type="button"
					className={cn(
						buttonVariants({ variant: "outline" }),
						"w-full hover:bg-transparent hover:text-primary hover:border-primary",
					)}
					onClick={() => {
						setIsGoogleLoading(true);
						signIn("google");
					}}
					disabled={isLoading || isGoogleLoading}
				>
					{isGoogleLoading ? (
						<Icons.spinner className="mr-2 size-4 animate-spin" />
					) : (
						<Icons.google className="mr-2 size-4" />
					)}{" "}
					Google
				</button>
			</div>
		</div>
	);
}
