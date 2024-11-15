"use client";

import { getWaitlistReferrals } from "@/actions/waitlist-referral";
import { getWaitlistSignups } from "@/actions/waitlist-signups";
import { Progress } from "@/components/ui/progress";
import { priorityColors } from "@/utils/user";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ArrowUpRight,
	ChevronLeft,
	ChevronRight,
	Download,
	FileJson,
	HelpCircle,
	MoreVertical,
	Search,
	Trash2,
	UserCheck,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Loading from "../shared/loading";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";

export const UserSegmentation = ({ waitlistId }) => {
	const [users, setUsers] = useState([]);
	const [referralCounts, setReferralCounts] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);
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
					user.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
	}, []);

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

	const handleDeleteUser = (userId) => {
		setDeleteTarget(userId);
		setDeleteModalOpen(true);
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
				setDeleteTarget(null);
				setDeleteModalOpen(true);
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

	const confirmDelete = () => {
		if (deleteTarget === null) {
			setUsers(users.filter((user) => !selectedUsers.includes(user.id)));
			setSelectedUsers([]);
		} else {
			setUsers(users.filter((user) => user.id !== deleteTarget));
			setSelectedUsers(selectedUsers.filter((id) => id !== deleteTarget));
		}
		setDeleteModalOpen(false);
	};

	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true);
				const signupsResult = await getWaitlistSignups(waitlistId);
				if (signupsResult.success) {
					setUsers(signupsResult.data);
				} else {
					setError(signupsResult.error);
				}

				const referralsResult = await getWaitlistReferrals(waitlistId);
				if (referralsResult.success) {
					const counts = {};
					for (const referral of referralsResult.data) {
						counts[referral.referredById] = referral._count.signUpId;
					}
					setReferralCounts(counts);
				} else {
					setError(referralsResult.error);
				}
			} catch (err) {
				setError("Failed to fetch data");
				console.error(err);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [waitlistId]);

	if (loading) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>User Segmentation</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-96">
					<Loading />
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Error</CardTitle>
					<CardDescription className="text-red-500">{error}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<>
			<div className="grid gap-4 my-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Total Sign-ups
						</CardTitle>
						<Users className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{users.length}</div>
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
			<Card className="w-full">
				<CardHeader>
					<CardTitle>User Segmentation</CardTitle>
					<CardDescription>
						Categorize and prioritize users for early access
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-between gap-4 mb-4 sm:flex-row">
						<div className="relative w-full max-w-sm">
							<Search
								height={20}
								width={20}
								className="absolute text-gray-400 transform -translate-y-1/2 left-2 top-1/2"
							/>
							<Input
								placeholder="Search users..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-8 rounded-xl"
							/>
						</div>
						<Button variant="outline" className="w-full sm:w-auto">
							<Download className="w-4 h-4 mr-2" /> Download
						</Button>
					</div>
					<div className="-mx-4 overflow-x-auto sm:mx-0">
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
									<TableHead className="w-[250px]">User Email</TableHead>
									<TableHead className="text-center">Referral Count</TableHead>
									<TableHead>Device</TableHead>
									<TableHead>
										<Button
											variant="ghost"
											onClick={requestSort}
											className="hover:bg-transparent"
										>
											Priority {getSortIcon()}
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="w-4 h-4 transition-colors text-muted-foreground hover:text-primary" />
													</TooltipTrigger>
													<TooltipContent
														className="max-w-[280px] bg-popover text-popover-foreground shadow-lg rounded-lg border border-border p-4 dark:bg-zinc-900"
														sideOffset={5}
													>
														<div className="space-y-2">
															<p className="font-medium">
																Priority is based on the number of referrals:
															</p>
															<ul className="space-y-1 list-none">
																<li className="flex items-center gap-2">
																	<span className="w-2 h-2 rounded-full bg-amber-500" />
																	<span>High: More than 5 referrals</span>
																</li>
																<li className="flex items-center gap-2">
																	<span className="w-2 h-2 bg-purple-500 rounded-full" />
																	<span>Medium: 1 to 5 referrals</span>
																</li>
																<li className="flex items-center gap-2">
																	<span className="w-2 h-2 bg-orange-500 rounded-full" />
																	<span>Low: No referrals</span>
																</li>
															</ul>
														</div>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</Button>
									</TableHead>
									<TableHead>Action</TableHead>
									<TableHead>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													className="relative w-8 h-8 p-0"
													disabled={selectedUsers.length === 0}
												>
													<MoreVertical className="w-4 h-4" />
													{selectedUsers.length > 0 && (
														<span className="absolute top-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-red-600 rounded-full -right-2">
															{selectedUsers.length}
														</span>
													)}
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													className="cursor-pointer"
													onClick={() => handleBulkAction("delete")}
												>
													<Trash2 className="w-4 h-4 mr-2" />
													<span>Delete User</span>
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
												<div className="flex items-center">
													<span className="hidden sm:inline">{user.name}</span>
												</div>
											</TableCell>
											<TableCell className="text-center">
												{referralCounts[user.id] || 0}
											</TableCell>
											<TableCell>
												{user.device.charAt(0).toUpperCase() +
													user.device.slice(1)}
											</TableCell>
											<TableCell>
												<span
													className={`font-medium ml-5 ${
														priorityColors[user.priority]
													}`}
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
										<TableCell colSpan={6} className="h-24 text-center">
											No users found, don't be shy to invite some!
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex flex-col items-center justify-between mt-4 space-y-4 sm:flex-row sm:space-y-0">
						<div className="order-2 text-sm text-muted-foreground sm:order-1">
							Showing{" "}
							{Math.min(
								sortedAndFilteredUsers.length,
								(currentPage - 1) * 10 + 1,
							)}{" "}
							-{Math.min(sortedAndFilteredUsers.length, currentPage * 10)} of{" "}
							{sortedAndFilteredUsers.length} results
						</div>
						<div className="flex items-center order-1 space-x-2 sm:order-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							<div className="flex items-center">
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
												size="icon"
												onClick={() => setCurrentPage(pageNumber)}
												className="hidden mx-1 sm:inline-flex"
											>
												{pageNumber}
											</Button>
										);
									}
									return null;
								})}
								<span className="mx-2 sm:hidden">
									Page {currentPage} of {pageCount}
								</span>
							</div>
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
				<AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								Are you sure you want to delete?
							</AlertDialogTitle>
							<AlertDialogDescription>
								{deleteTarget === null
									? `This will permanently delete ${selectedUsers.length} selected users.`
									: "This will permanently delete the selected user."}
								This action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={confirmDelete}
								className="bg-red-600 hover:bg-red-700"
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Card>
		</>
	);
};
