"use client";

import { RefreshCw, Send } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { EmailForm } from "./email-form";

export const EmailTemplateContent = ({ waitList, updateEmailTemplate }) => {
	const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);
	const [testEmail, setTestEmail] = useState("");
	const [selectedTemplate, setSelectedTemplate] = useState("signup");

	const selectedTemplateRef = React.useRef(selectedTemplate);

	useEffect(() => {
		selectedTemplateRef.current = selectedTemplate;
	}, [selectedTemplate]);

	const form = useForm({
		defaultValues: {
			signup: waitList.emailTemplates?.signup || {
				subject: "Welcome to {{waitlist}}!",
				previewText: "Join our exclusive waitlist",
				header: "Welcome Aboard!",
				subHeader: "We're excited to have you",
				mainBody:
					"Thanks for joining {{waitlist}}.\nPlease verify your email to secure your spot.",
				subBody: "You're currently #{{position}} in line",
			},
			referral: {
				subject: "Share {{waitlist}} with friends",
				previewText: "Invite friends and move up the list",
				header: "Share & Earn",
				subHeader: "Invite your friends",
				mainBody: "Share your unique referral link to move up the waitlist.",
				subBody: "You've invited {{referral_count}} friends so far",
			},
			verification: {
				subject: "Verify your email for {{waitlist}}",
				previewText: "Quick verification needed",
				header: "One Last Step",
				subHeader: "Verify your email",
				mainBody: "Click the link below to verify your email address",
				subBody: "This link expires in {{expiry_time}}",
			},
			offboarding: {
				subject: "Sorry to see you go - {{waitlist}}",
				previewText: "Unsubscribe confirmation",
				header: "Farewell",
				subHeader: "You've been unsubscribed",
				mainBody: "You've been successfully removed from our waitlist",
				subBody: "We'd love to hear your feedback",
			},
		},
	});

	const replaceTemplateVariables = (text) => {
		const replacements = {
			"{{waitlist}}": waitList.name,
			"{{verification_link}}": "https://example.com/verify",
			"{{position}}": "42",
			"{{referral_link}}": "https://example.com/ref/123",
			"{{referral_count}}": "5",
			"{{rewards}}": "Early Access",
			"{{expiry_time}}": "24 hours",
			"{{reason}}": "No longer interested",
			"{{feedback_link}}": "https://example.com/feedback",
		};

		return text.replace(
			/\{\{[^}]+\}\}/g,
			(match) => replacements[match] || match,
		);
	};

	const getCurrentTemplatePreview = () => {
		const templateData = form.getValues(selectedTemplate);
		return {
			subject: replaceTemplateVariables(templateData.subject),
			previewText: replaceTemplateVariables(templateData.previewText),
			header: replaceTemplateVariables(templateData.header),
			subHeader: replaceTemplateVariables(templateData.subHeader),
			mainBody: replaceTemplateVariables(templateData.mainBody),
			subBody: replaceTemplateVariables(templateData.subBody),
		};
	};

	const [preview, setPreview] = useState(getCurrentTemplatePreview());

	const updatePreview = () => {
		setPreview(getCurrentTemplatePreview());
	};

	useEffect(() => {
		updatePreview();
	}, [selectedTemplate]);

	const handleSaveTemplate = async (values) => {
		try {
			await updateEmailTemplate({
				type: selectedTemplate,
				...form.getValues(selectedTemplate),
			});
			toast.success("Email template saved successfully");
		} catch (error) {
			toast.error("Failed to save email template");
		}
	};

	const handleSendTestEmail = async () => {
		setIsTestEmailLoading(true);
		try {
			// Implement your test email sending logic here
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success("Test email sent successfully");
		} catch (error) {
			toast.error("Failed to send test email");
		} finally {
			setIsTestEmailLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto">
			<Tabs
				defaultValue="edit"
				onValueChange={(value) => value === "preview" && updatePreview()}
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="edit">Edit Templates</TabsTrigger>
					<TabsTrigger value="preview">Preview</TabsTrigger>
				</TabsList>

				<TabsContent value="edit">
					<FormProvider {...form}>
						<form onSubmit={form.handleSubmit(handleSaveTemplate)}>
							<Tabs
								defaultValue="signup"
								value={selectedTemplate}
								onValueChange={(value) => setSelectedTemplate(value)}
								className="mt-4"
							>
								<TabsList className="grid w-full grid-cols-4">
									<TabsTrigger value="signup">Sign Up</TabsTrigger>
									<TabsTrigger value="referral">Referral</TabsTrigger>
									<TabsTrigger value="verification">Verification</TabsTrigger>
									<TabsTrigger value="offboarding">Offboarding</TabsTrigger>
								</TabsList>

								<TabsContent value="signup">
									<EmailForm type="signup" form={form} />
								</TabsContent>
								<TabsContent value="referral">
									<EmailForm type="referral" form={form} />
								</TabsContent>
								<TabsContent value="verification">
									<EmailForm type="verification" form={form} />
								</TabsContent>
								<TabsContent value="offboarding">
									<EmailForm type="offboarding" form={form} />
								</TabsContent>
							</Tabs>

							<div className="mt-4">
								<Button type="submit">Save All Templates</Button>
							</div>
						</form>
					</FormProvider>
				</TabsContent>

				<TabsContent value="preview" className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Email Preview</h2>
						<Button variant="outline" size="sm" onClick={updatePreview}>
							<RefreshCw className="w-4 h-4 mr-2" />
							Refresh Preview
						</Button>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">{preview.subject}</CardTitle>
							<CardDescription>
								{testEmail || "preview@example.com"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="prose-sm prose">
								<h2>{preview.header}</h2>
								<h3 className="text-muted-foreground">{preview.subHeader}</h3>
								<div className="whitespace-pre-wrap">{preview.mainBody}</div>
								<p className="mt-4 text-sm text-muted-foreground">
									{preview.subBody}
								</p>
							</div>
						</CardContent>
					</Card>

					<div className="flex items-end gap-2">
						<div className="flex-1 space-y-2">
							<Label htmlFor="testEmail">Send test email to</Label>
							<Input
								id="testEmail"
								type="email"
								placeholder="your@email.com"
								value={testEmail}
								onChange={(e) => setTestEmail(e.target.value)}
							/>
						</div>
						<Button
							onClick={handleSendTestEmail}
							disabled={isTestEmailLoading || !testEmail}
						>
							{isTestEmailLoading ? (
								"Sending..."
							) : (
								<>
									Send Test <Send className="w-4 h-4 ml-2" />
								</>
							)}
						</Button>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};
