"use client";

import GoogleIcon from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock, Mail, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters long"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
});

export default function Register() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
	});

	const router = useRouter();
	const [agreeToTerms, setAgreeToTerms] = useState(false);

	useEffect(() => {
		const agreed = localStorage.getItem("agreeToTerms");
		if (agreed === "true") {
			setAgreeToTerms(true);
		}
	}, []);

	const onSubmit = (data) => {
		if (!agreeToTerms) {
			toast({
				title: "Please agree to the terms & policies.",
				description: "You must agree to the terms & policies to continue.",
				variant: "destructive",
			});
			return;
		}
		console.log(data);

		// Handle registration logic here
		router.push("/otp-verify");
	};

	const handleCheckboxChange = (event) => {
		const isChecked = event.target.checked;
		setAgreeToTerms(isChecked);
		localStorage.setItem("agreeToTerms", isChecked ? "true" : "false");
	};

	return (
		<div className="flex min-h-screen overflow-hidden bg-background text-foreground">
			<div className="hidden w-1/2 lg:block">
				<Image
					src="/images/register.svg"
					alt="Register Image"
					width={108}
					height={108}
					className="w-[35rem] h-[35rem] mx-auto mt-12"
				/>
			</div>
			<div className="flex flex-col justify-center w-full px-8 py-12 lg:w-1/2 sm:px-16">
				<Link
					href="/login"
					className="absolute flex items-center transition-colors text-foreground top-4 right-4 hover:text-primary"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Login
				</Link>
				<div className="w-full max-w-md mx-auto">
					<h2 className="mb-2 text-3xl font-bold">Create Your Account</h2>
					<p className="mb-8 text-muted-foreground">Sign up to get started</p>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div>
							<Label
								htmlFor="name"
								className="text-sm font-medium text-foreground"
							>
								Name
							</Label>
							<div className="relative">
								<Input
									id="name"
									{...register("name")}
									type="text"
									className="w-full py-2 pl-10 pr-4 transition-all duration-200 border rounded-full bg-background/50 border-input focus:border-primary focus:ring-2 focus:ring-primary/50"
									placeholder="Enter your name"
								/>
								<User className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
							</div>
							{errors.name && (
								<p className="mt-1 text-sm text-destructive">
									{errors.name.message}
								</p>
							)}
						</div>
						<div>
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
						<div>
							<Label
								htmlFor="password"
								className="text-sm font-medium text-foreground"
							>
								Password
							</Label>
							<div className="relative">
								<Input
									id="password"
									{...register("password")}
									type="password"
									autoComplete="new-password"
									className="w-full py-2 pl-10 pr-4 transition-all duration-200 border rounded-full bg-background/50 border-input focus:border-primary focus:ring-2 focus:ring-primary/50"
									placeholder="Enter your password"
								/>
								<Lock className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
							</div>
							{errors.password && (
								<p className="mt-1 text-sm text-destructive">
									{errors.password.message}
								</p>
							)}
						</div>
						<div className="flex items-center">
							<Input
								id="agreeToTerms"
								type="checkbox"
								className="w-4 h-4 mr-2"
								checked={agreeToTerms}
								onChange={handleCheckboxChange}
							/>
							<Label
								htmlFor="agreeToTerms"
								className="text-sm text-muted-foreground"
							>
								I agree to the{" "}
								<Link href="/terms" className="text-primary hover:underline">
									Terms
								</Link>{" "}
								&{" "}
								<Link href="/privacy" className="text-primary hover:underline">
									Privacy Policy
								</Link>
							</Label>
						</div>
						<Button
							type="submit"
							className="w-full p-4 text-lg text-white rounded-xl"
						>
							Sign up
						</Button>
					</form>
					<div className="mt-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-border" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-background text-muted-foreground">
									Or continue with
								</span>
							</div>
						</div>
						<Button
							variant="outline"
							className="w-full p-6 mt-6 rounded-xl hover:text-primary hover:bg-transparent"
						>
							<GoogleIcon className="w-5 h-5 mr-2" />
							Sign up with Google
						</Button>
					</div>
					<p className="mt-8 text-sm text-center text-muted-foreground">
						Already have an account?{" "}
						<Link href="/login" className="text-primary hover:underline">
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
