"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
	email: z.string().email("Invalid email address"),
});

export default function ForgotPassword() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(schema),
	});

	const [isEmailSent, setIsEmailSent] = useState(false);

	const onSubmit = async (data) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Here you would typically call your API to send the reset email
		console.log("Reset email requested for:", data.email);

		setIsEmailSent(true);
		toast({
			title: "Reset email sent",
			description: "Check your inbox for further instructions.",
		});
	};

	return (
		<div className="flex min-h-screen bg-background text-foreground">
			<div className="hidden w-1/2 lg:block">
				<Image
					src="/images/forgot_password.svg"
					alt="Forgot Password Image"
					width={108}
					height={108}
					className="w-[40rem] h-[40rem] mx-auto"
				/>
			</div>
			<div className="flex flex-col justify-center w-full px-8 py-12 lg:w-1/2 sm:px-16">
				<Link
					href="/"
					className="absolute flex items-center transition-colors text-foreground top-4 right-4 hover:text-primary"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</Link>
				<div className="w-full max-w-md mx-auto">
					<h2 className="mb-2 text-3xl font-bold">Forgot Password</h2>
					<p className="mb-8 text-muted-foreground">
						Enter your email address and we&apos;ll send you instructions to
						reset your password.
					</p>
					{!isEmailSent ? (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							<div className="space-y-2">
								<Label
									htmlFor="email"
									className="text-sm font-medium text-foreground"
								>
									Email address
								</Label>
								<div className="relative">
									<Input
										id="email"
										{...register("email")}
										type="email"
										autoComplete="email"
										className="w-full py-2 pl-10 pr-4 transition-all duration-200 border rounded-full bg-background/50 border-input focus:border-primary focus:ring-2 focus:ring-primary/50"
										placeholder="Enter your email"
									/>
									<Mail className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
								</div>
								{errors.email && (
									<p className="mt-1 text-sm text-destructive">
										{errors.email.message}
									</p>
								)}
							</div>
							<Button
								type="submit"
								className="w-full p-4 text-lg text-white rounded-xl"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Sending..." : "Send Reset Instructions"}
							</Button>
						</form>
					) : (
						<div className="text-center">
							<div className="mb-4 text-primary">
								<Mail className="w-12 h-12 mx-auto" />
							</div>
							<h3 className="mb-2 text-xl font-semibold">Check Your Email</h3>
							<p className="mb-6 text-muted-foreground">
								We&apos;ve sent password reset instructions to your email
								address.
							</p>
							<Link href="/login" className="block mb-4" asChild>
								<Button
									variant="outline"
									className="inline-flex items-center rounded-full hover:bg-primary dark:hover:bg-transparent hover:border-primary"
								>
									Return to Login
									<ArrowRight className="w-4 h-4 ml-2" />
								</Button>
							</Link>
						</div>
					)}
					<div className="mt-8 text-center">
						<p className="text-sm text-muted-foreground">
							Remember your password?{" "}
							<Link href="/login" className="text-primary hover:underline">
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
