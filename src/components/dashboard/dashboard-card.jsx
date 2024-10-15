"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	ArrowUpRight,
	Download,
	FileJson,
	MoreVertical,
	Search,
	Target,
	Trash2,
	UserCheck,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Checkbox } from "../ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const userRoles = ["User", "VIP", "Early Adopter", "Influencer", "Beta Tester"];

const priorityColors = {
	High: "text-red-500",
	Medium: "text-yellow-500",
	Low: "text-green-500",
};

const peakInterestData = [
	{ hour: "12am", users: 10 },
	{ hour: "3am", users: 5 },
	{ hour: "6am", users: 15 },
	{ hour: "9am", users: 30 },
	{ hour: "12pm", users: 45 },
	{ hour: "3pm", users: 60 },
	{ hour: "6pm", users: 75 },
	{ hour: "9pm", users: 50 },
];

export default function DashboardCard() {
	const [users, setUsers] = useState([
		{
			id: 1,
			name: "Alice Johnson",
			avatar: "/avatars/alice.jpg",
			category: "Influencer",
			referralSource: "Twitter",
			priority: "High",
		},
		{
			id: 2,
			name: "Bob Smith",
			avatar: "/avatars/bob.jpg",
			category: "Early Adopter",
			referralSource: "Direct Link",
			priority: "Medium",
		},
		{
			id: 3,
			name: "Carol White",
			avatar: "/avatars/carol.jpg",
			category: "VIP",
			referralSource: "Email Campaign",
			priority: "Low",
		},
	]);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedUsers, setSelectedUsers] = useState([]);

	const filteredUsers = useMemo(() => {
		return users.filter((user) =>
			Object.values(user).some((value) =>
				value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
			),
		);
	}, [users, searchTerm]);

	const handleRoleChange = (userId, newRole) => {
		setUsers(
			users.map((user) =>
				user.id === userId ? { ...user, category: newRole } : user,
			),
		);
	};

	const handleDeleteUser = (userId) => {
		setUsers(users.filter((user) => user.id !== userId));
		setSelectedUsers(selectedUsers.filter((id) => id !== userId));
	};

	const handleSelectUser = (userId) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleSelectAll = (checked) => {
		if (checked) {
			setSelectedUsers(filteredUsers.map((user) => user.id));
		} else {
			setSelectedUsers([]);
		}
	};

	const handleBulkAction = (action) => {
		switch (action) {
			case "delete":
				setUsers(users.filter((user) => !selectedUsers.includes(user.id)));
				setSelectedUsers([]);
				break;
			case "export": {
				const selectedUserData = users.filter((user) =>
					selectedUsers.includes(user.id),
				);
				const jsonStr = JSON.stringify(selectedUserData, null, 2);
				const blob = new Blob([jsonStr], { type: "application/json" });
				const href = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = href;
				link.download = "selected_users.json";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				break;
			}
			default:
				console.log(`Bulk ${action} for users:`, selectedUsers);
		}
	};

	return (
		<div className="p-8 space-y-8">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Total Sign-ups
						</CardTitle>
						<Users className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">2,350</div>
						<p className="text-xs text-muted-foreground">
							+20.1% from last month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Conversion Rate
						</CardTitle>
						<ArrowUpRight className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">32.5%</div>
						<p className="text-xs text-muted-foreground">
							+4.5% from last week
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Current Waitlist Position
						</CardTitle>
						<Target className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">#156</div>
						<p className="text-xs text-muted-foreground">
							Estimated wait: 3 days
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
						<UserCheck className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">78%</div>
						<Progress value={78} className="mt-2" />
						<p className="mt-2 text-xs text-muted-foreground">
							550 sign-ups to early access
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Peak Interest Times for Waitlist</CardTitle>
					<CardDescription>
						Chart showing user activity throughout the day
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ChartContainer
						config={{
							users: {
								label: "Users",
								color: "hsl(var(--chart-1))",
							},
						}}
						className="h-[300px]"
					>
						<BarChart data={peakInterestData}>
							<XAxis dataKey="hour" tickLine={false} axisLine={false} />
							<YAxis
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => `${value}`}
							/>
							<Bar
								dataKey="users"
								fill="var(--color-users)"
								radius={[4, 4, 0, 0]}
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<Card className="w-full">
				<CardHeader>
					<CardTitle>User Segmentation</CardTitle>
					<CardDescription>
						Categorize and prioritize users for early access
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between mb-4">
						<div className="relative w-full max-w-sm">
							<Search className="absolute text-sm text-gray-400 transform -translate-y-1/2 left-2 top-1/2" />
							<Input
								placeholder="Search users..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-8"
							/>
						</div>
						<Button variant="outline">
							<Download className="w-4 h-4 mr-2" /> Download
						</Button>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[30px]">
									<Checkbox
										checked={selectedUsers.length === filteredUsers.length}
										onCheckedChange={handleSelectAll}
									/>
								</TableHead>
								<TableHead>User</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Referral Source</TableHead>
								<TableHead>Priority</TableHead>
								<TableHead>Action</TableHead>
								<TableHead>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												className="w-8 h-8 p-0"
												disabled={selectedUsers.length === 0}
											>
												<MoreVertical className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={() => handleBulkAction("delete")}
											>
												<Trash2 className="w-4 h-4 mr-2" />
												<span>Delete files</span>
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={() => handleBulkAction("export")}
											>
												<FileJson className="w-4 h-4 mr-2" />
												<span>Export selected as JSON</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredUsers.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<Checkbox
											checked={selectedUsers.includes(user.id)}
											onCheckedChange={() => handleSelectUser(user.id)}
										/>
									</TableCell>
									<TableCell className="font-medium">
										<div className="flex items-center space-x-2">
											<Avatar>
												<AvatarImage src={user.avatar} alt={user.name} />
												<AvatarFallback>
													{user.name
														.split(" ")
														.map((n) => n[0])
														.join("")}
												</AvatarFallback>
											</Avatar>
											<span>{user.name}</span>
										</div>
									</TableCell>
									<TableCell>
										<Select
											onValueChange={(value) =>
												handleRoleChange(user.id, value)
											}
											defaultValue={user.category}
										>
											<SelectTrigger className="w-[140px]">
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
											<SelectContent className="cursor-pointer">
												{userRoles.map((role) => (
													<SelectItem
														className="cursor-pointer"
														key={role}
														value={role}
													>
														{role}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>{user.referralSource}</TableCell>
									<TableCell>
										<span
											className={`font-medium ${priorityColors[user.priority]}`}
										>
											{user.priority}
										</span>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" className="w-8 h-8 p-0">
													<MoreVertical className="w-4 h-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													className="text-red-600 cursor-pointer"
													onClick={() => handleDeleteUser(user.id)}
												>
													<Trash2 className="w-4 h-4 mr-2 text-red-600" />
													<span className="text-red-600">Delete</span>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
