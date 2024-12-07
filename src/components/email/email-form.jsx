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
						<FormControl>
							<Textarea className="min-h-[100px] font-mono" {...field} />
						</FormControl>
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
