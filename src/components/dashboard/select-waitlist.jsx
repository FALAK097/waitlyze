"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export const SelectWaitlist = ({ waitLists }) => {
	const [selectedWaitlist, setSelectedWaitlist] = useState("");

	useEffect(() => {
		const savedWaitlist = localStorage.getItem("selectedWaitlist");
		if (savedWaitlist) setSelectedWaitlist(savedWaitlist);
	}, []);

	const handleSelectChange = (value) => {
		setSelectedWaitlist(value);
		localStorage.setItem("selectedWaitlist", value);
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
								value={waitlist.name}
							>
								{waitlist.name}
							</SelectItem>
						))
					) : (
						<SelectContent>
							<p className="mb-2 text-center text-gray-500">
								No waitlists available
							</p>
							<Link href="/wait-lists/new">
								<Button className="gap-2" variant="ghost">
									<PlusCircle className="w-5 h-5" />
									<span>Create a new waitlist</span>
								</Button>
							</Link>
						</SelectContent>
					)}
				</SelectContent>
			</Select>
		</div>
	);
};
