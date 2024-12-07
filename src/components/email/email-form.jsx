"use client";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { EMAIL_VARIABLES } from "@/utils/email";
import { Bold, HelpCircle, Italic, Link } from "lucide-react";
import { FormProvider } from "react-hook-form";

export const EmailForm = ({ type, form }) => (
	<FormProvider {...form}>
		<div className="space-y-4">
			<FormField
				control={form.control}
				name={`${type}.subject`}
				render={({ field }) => (
					<FormItem>
						<FormLabel className="flex items-center gap-2">
							Email Subject
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<HelpCircle className="w-4 h-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="max-w-sm">
										<div className="space-y-2">
											<p className="font-semibold">Available Variables:</p>
											{Object.entries(EMAIL_VARIABLES[type]).map(
												([variable, description]) => (
													<div key={variable}>
														<code className="text-sm">{variable}</code>
														<p className="text-sm text-muted-foreground">
															{description}
														</p>
													</div>
												),
											)}
										</div>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name={`${type}.previewText`}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Preview Text</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormDescription>
							This text appears in email clients as a preview
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name={`${type}.header`}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Header</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name={`${type}.subHeader`}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Sub Header</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name={`${type}.mainBody`}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Main Body Text</FormLabel>
						<div className="space-y-2">
							<div className="flex items-center gap-2 pb-4 border-b">
								<Toggle aria-label="Toggle bold">
									<Bold className="w-4 h-4" />
								</Toggle>
								<Toggle aria-label="Toggle italic">
									<Italic className="w-4 h-4" />
								</Toggle>
								<Toggle aria-label="Add link">
									<Link className="w-4 h-4" />
								</Toggle>
							</div>
							<FormControl>
								<Textarea className="min-h-[100px] font-mono" {...field} />
							</FormControl>
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name={`${type}.subBody`}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Sub Body Text</FormLabel>
						<FormControl>
							<Textarea className="min-h-[60px]" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	</FormProvider>
);
