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
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
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
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ArrowUpRight,
	ChevronLeft,
	ChevronRight,
	Download,
	FileJson,
	MoreVertical,
	Search,
	Trash2,
	UserCheck,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const getCurrentWeekDates = (startDay = 0) => {
	const today = new Date();
	const dayOfWeek = today.getDay();
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - dayOfWeek + startDay);

	return Array.from({ length: 7 }, (_, i) => {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	});
};

const peakInterestData = {
	daily: Array.from({ length: 24 }, (_, i) => ({
		hour: `${i}:00`,
		users: Math.floor(Math.random() * 100),
	})),
	weekly: getCurrentWeekDates().map((date) => ({
		date,
		users: Math.floor(Math.random() * 500) + 100,
	})),
};

const generateMockUsers = (count) => {
	return Array.from({ length: count }, (_, i) => ({
		id: i + 1,
		name: `User ${i + 1}`,
		avatar: `/avatars/user${i + 1}.jpg`,
		category: userRoles[Math.floor(Math.random() * userRoles.length)],
		referralSource: [
			"Twitter",
			"Direct Link",
			"Email Campaign",
			"Facebook",
			"LinkedIn",
		][Math.floor(Math.random() * 5)],
		priority: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
	}));
};

export default function DashboardCard() {
	const [users, setUsers] = useState(generateMockUsers(50));
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [view, setView] = useState("daily");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortConfig, setSortConfig] = useState({
		key: null,
		direction: null,
	});
	const usersPerPage = 10;

	const sortedAndFilteredUsers = useMemo(() => {
		let sortableUsers = [...users];
		if (searchTerm) {
			sortableUsers = sortableUsers.filter(
				(user) =>
					user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.referralSource
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					user.priority.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		}
		if (sortConfig.key === "priority" && sortConfig.direction) {
			sortableUsers.sort((a, b) => {
				const priorityOrder = { High: 0, Medium: 1, Low: 2 };
				if (priorityOrder[a.priority] < priorityOrder[b.priority]) {
					return sortConfig.direction === "ascending" ? -1 : 1;
				}
				if (priorityOrder[a.priority] > priorityOrder[b.priority]) {
					return sortConfig.direction === "ascending" ? 1 : -1;
				}
				return 0;
			});
		}
		return sortableUsers;
	}, [users, searchTerm, sortConfig]);

	const pageCount = Math.ceil(sortedAndFilteredUsers.length / usersPerPage);
	const paginatedUsers = sortedAndFilteredUsers.slice(
		(currentPage - 1) * usersPerPage,
		currentPage * usersPerPage,
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, sortConfig]);

	const requestSort = () => {
		setSortConfig((prevConfig) => {
			if (prevConfig.direction === null) {
				return { key: "priority", direction: "ascending" };
			}
			if (prevConfig.direction === "ascending") {
				return { key: "priority", direction: "descending" };
			}
			return { key: null, direction: null };
		});
	};

	const getSortIcon = () => {
		if (sortConfig.direction === null) {
			return <ArrowUpDown className="w-4 h-4" />;
		}
		return sortConfig.direction === "ascending" ? (
			<ArrowUp className="w-4 h-4" />
		) : (
			<ArrowDown className="w-4 h-4" />
		);
	};

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
			setSelectedUsers(sortedAndFilteredUsers.map((user) => user.id));
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

	const CustomTooltip = ({ active, payload, label }) => {
		if (active && payload && payload.length) {
			return (
				<div className="p-2 border rounded-md shadow-md bg-background border-border">
					<p className="text-sm font-medium">
						{view === "daily" ? `Hours: ${label}` : `Date: ${label}`}
					</p>
					<p className="text-sm">{`Users: ${payload[0].value}`}</p>
				</div>
			);
		}
		return null;
	};

	const CustomLegend = () => (
		<div className="flex justify-end mb-2 space-x-4">
			<div className="flex items-center">
				<div className="w-3 h-3 mr-2 bg-primary" />
				<span className="text-sm">{view === "daily" ? "Hours" : "Date"}</span>
			</div>
			<div className="flex items-center">
				<div className="w-3 h-3 mr-2 bg-secondary" />
				<span className="text-sm">Users</span>
			</div>
		</div>
	);

	return (
		<div className="p-4 space-y-8 sm:p-6 lg:p-8">
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
							Referral Conversions
						</CardTitle>
						<Users className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">
							1,250 <span className="text-lg">/ 2,350</span>
						</p>
						<p className="text-xs text-muted-foreground">
							+15.2% from last month
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
					<CardDescription>Chart showing user activity trends</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between mb-4">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									View: {view === "daily" ? "Hourly" : "Weekly"}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => setView("daily")}
								>
									Hourly View
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => setView("weekly")}
								>
									Weekly View
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<CustomLegend />
					</div>
					<ChartContainer
						config={{
							users: {
								label: "Users",
								color: "hsl(var(--primary))",
							},
						}}
						className="h-[300px] w-full"
					>
						<BarChart data={peakInterestData[view]}>
							<XAxis
								dataKey={view === "daily" ? "hour" : "date"}
								tickLine={false}
								axisLine={false}
								fontSize={12}
								textAnchor="middle"
								height={50}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => `${value}`}
								fontSize={12}
							/>
							<Bar
								dataKey="users"
								fill="hsl(var(--primary))"
								radius={[4, 4, 0, 0]}
							/>
							<ChartTooltip cursor={false} content={<CustomTooltip />} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>User Segmentation</CardTitle>
					<CardDescription>
						Categorize and prioritize users for early access
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between gap-2 mb-4">
						<div className="relative w-full max-w-sm">
							<Search
								height={20}
								width={20}
								className="absolute text-sm text-gray-400 transform -translate-y-1/2 left-2 top-1/2"
							/>
							<Input
								placeholder="Search users..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-8 rounded-xl"
							/>
						</div>
						<Button variant="outline">
							<Download className="w-4 h-4 mr-2" /> Download
						</Button>
					</div>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[30px]">
										<Checkbox
											checked={
												selectedUsers.length === sortedAndFilteredUsers.length
											}
											onCheckedChange={handleSelectAll}
										/>
									</TableHead>
									<TableHead className="w-[250px]">User</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Referral Source</TableHead>
									<TableHead>
										<Button
											variant="ghost"
											onClick={requestSort}
											className="hover:bg-transparent"
										>
											Priority {getSortIcon()}
										</Button>
									</TableHead>
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
								{paginatedUsers.length > 0 ? (
									paginatedUsers.map((user) => (
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
													className={`font-medium ml-5 ${priorityColors[user.priority]}`}
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
									))
								) : (
									<TableRow>
										<TableCell colSpan={7} className="h-24 text-center">
											No users found, don't be shy to invite some!
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex items-center justify-between mt-4">
						<div className="text-sm text-muted-foreground">
							Showing{" "}
							{Math.min(
								sortedAndFilteredUsers.length,
								(currentPage - 1) * usersPerPage + 1,
							)}{" "}
							-{" "}
							{Math.min(
								sortedAndFilteredUsers.length,
								currentPage * usersPerPage,
							)}{" "}
							of {sortedAndFilteredUsers.length} results
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							{Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
								const pageNumber =
									currentPage <= 3 ? i + 1 : currentPage + i - 2;
								if (pageNumber <= pageCount) {
									return (
										<Button
											key={pageNumber}
											variant={
												currentPage === pageNumber ? "default" : "outline"
											}
											size="sm"
											onClick={() => setCurrentPage(pageNumber)}
										>
											{pageNumber}
										</Button>
									);
								}
								return null;
							})}
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage((prev) => Math.min(prev + 1, pageCount))
								}
								disabled={currentPage === pageCount}
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
