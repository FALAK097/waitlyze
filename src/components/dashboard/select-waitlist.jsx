"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export const SelectWaitlist = ({ waitLists }) => {
	const [selectedWaitlist, setSelectedWaitlist] = useState(() => {
		if (typeof window === "undefined") return "";
		return localStorage.getItem("selectedWaitlist") || "";
	});

	const handleSelectChange = (value) => {
		setSelectedWaitlist(value);
		localStorage.setItem("selectedWaitlist", value);
		window.location.reload();
	};

	return (
		<div className="flex items-center space-x-4">
			<Select value={selectedWaitlist} onValueChange={handleSelectChange}>
				<SelectTrigger className="w-[200px]">
					<SelectValue placeholder="Select a waitlist" />
				</SelectTrigger>

				<SelectContent>
					{waitLists.length > 0 ? (
						waitLists.map((waitlist) => (
							<SelectItem
								key={waitlist.id}
								className="cursor-pointer"
								value={waitlist.id}
							>
								{waitlist.name.charAt(0).toUpperCase() + waitlist.name.slice(1)}
							</SelectItem>
						))
					) : (
						<SelectContent>
							<p className="mb-2 text-center text-muted-foreground">
								No waitlists available
							</p>
						</SelectContent>
					)}
				</SelectContent>
			</Select>
		</div>
	);
};
