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
import { FormProvider } from "react-hook-form";
import { MarkdownEditor } from "./markdown-editor";

export const EmailForm = ({ type, form }) => {
	return (
		<FormProvider {...form}>
			<div className="space-y-6">
				<FormField
					control={form.control}
					name={`${type}.subject`}
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2">
								Email Subject
							</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormDescription>
								Use {"{{"} waitlist {"}}"} to insert the waitlist name
							</FormDescription>
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
								<MarkdownEditor
									value={field.value}
									onChange={field.onChange}
									placeholder="Enter header text..."
								/>
							</FormControl>
							<FormDescription>
								Use {"{{"} waitlist {"}}"} to insert the waitlist name
							</FormDescription>
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
								<MarkdownEditor
									value={field.value}
									onChange={field.onChange}
									placeholder="Enter subheader text..."
								/>
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
							<FormLabel>Main Content</FormLabel>
							<FormControl>
								<MarkdownEditor
									value={field.value}
									onChange={field.onChange}
									placeholder="Enter your markdown content here..."
								/>
							</FormControl>
							<FormDescription>
								Use {"{{"} waitlist {"}}"} to insert the waitlist name
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name={`${type}.subBody`}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Footer Content</FormLabel>
							<FormControl>
								<MarkdownEditor
									value={field.value}
									onChange={field.onChange}
									placeholder="Enter footer content here..."
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</FormProvider>
	);
};
