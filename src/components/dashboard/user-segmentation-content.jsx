"use client";

import { cn } from "@/lib/utils";
import { priorityColors } from "@/utils/user";
import { AnimatePresence, m } from "framer-motion";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	FileJson,
	FileSpreadsheet,
	FileText,
	HelpCircle,
	Mail,
	MailCheck,
	MoreVertical,
} from "lucide-react";
import { Button } from "../ui/button";
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import {
	DeleteIcon,
	DownloadIcon,
	SearchIcon,
} from "../shared/icons";
import { MetricsCards } from "./user-segmentation-metrics";

const PriorityTooltip = () => (
	<div className="space-y-2">
		<p className="font-medium">Priority is based on the number of referrals:</p>
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
);

const CopyButtonIcons = ({ copied }) => (
	<>
		<div
			className={cn(
				"absolute inset-0 flex items-center justify-center transition-all duration-300",
				copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
			)}
		>
			<svg
				className="w-4 h-4 stroke-primary"
				viewBox="0 0 24 24"
				fill="none"
				strokeWidth={3}
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<polyline points="20 6 9 17 4 12" />
			</svg>
		</div>
		<div
			className={cn(
				"absolute inset-0 flex items-center justify-center transition-all duration-300",
				copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
			)}
		>
			<svg
				className="w-4 h-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
				<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
			</svg>
		</div>
		<span className="sr-only">{copied ? "Copied" : "Copy to clipboard"}</span>
	</>
);

const EmptyState = ({
	inputRef,
	copied,
	copyShareUrlToClipboard,
	waitlistId,
	totalColumns,
}) => (
	<TableRow className="hover:bg-transparent">
		<TableCell colSpan={totalColumns} className="h-[400px] p-0">
			<div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
				<div className="p-4 rounded-full bg-primary/10">
					<svg
						className="w-8 h-8 text-primary"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
				</div>
				<div className="space-y-2 text-center">
					<h3 className="text-2xl font-semibold tracking-tight">No users yet</h3>
					<p className="text-muted-foreground">
						Don&apos;t be shy, invite users to your waitlist
					</p>
				</div>
				<div className="w-full max-w-md space-y-4">
					<div className="relative">
						<Input
							ref={inputRef}
							readOnly
							className="pr-12 font-mono text-sm"
							defaultValue={`${typeof window !== "undefined" ? window.location.origin : ""}/forms/${waitlistId}`}
							style={{
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						/>
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="sm"
										variant="ghost"
										className={cn(
											"absolute right-1 top-1 h-7 w-8",
											"focus-visible:ring-1 focus-visible:ring-offset-1",
											"hover:bg-transparent active:bg-transparent",
											copied && "text-primary"
										)}
										disabled={copied}
										onClick={copyShareUrlToClipboard}
									>
										<CopyButtonIcons copied={copied} />
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="top"
									className="px-2 py-1 text-xs border"
								>
									{copied ? "Copied!" : "Copy to clipboard"}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<p className="text-sm text-center text-muted-foreground">
						Share this link to invite users to your waitlist
					</p>
				</div>
			</div>
		</TableCell>
	</TableRow>
);

const SortIcon = ({ direction }) => {
	if (direction === null) return <ArrowUpDown className="w-4 h-4" />;
	return direction === "ascending" ? (
		<ArrowUp className="w-4 h-4" />
	) : (
		<ArrowDown className="w-4 h-4" />
	);
};

const ActionBar = ({
	searchTerm,
	setSearchTerm,
	isOpen,
	setIsOpen,
	handlePDFExport,
	handleCSVExport,
}) => (
	<div className="flex flex-col items-center justify-between gap-4 mb-4 sm:flex-row">
		<div className="relative w-full max-w-sm">
			<SearchIcon />
			<Input
				placeholder="Search users..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				className="w-full pl-12 rounded-xl"
			/>
		</div>
		<div className="relative inline-block text-left">
			<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="w-full sm:w-auto">
						<DownloadIcon className="w-4 h-4 mr-2" />
						Download
					</Button>
				</DropdownMenuTrigger>
				<AnimatePresence>
					{isOpen && (
						<DropdownMenuContent
							align="end"
							className="w-48"
							asChild
							forceMount
						>
							<m.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
							>
								<DropdownMenuItem
									onClick={handlePDFExport}
									className="flex items-center cursor-pointer"
								>
									<FileText className="w-4 h-4 mr-2 text-primary" />
									<span>PDF Export</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={handleCSVExport}
									className="flex items-center cursor-pointer"
								>
									<FileSpreadsheet className="w-4 h-4 mr-2 text-primary" />
									<span>CSV Export</span>
								</DropdownMenuItem>
							</m.div>
						</DropdownMenuContent>
					)}
				</AnimatePresence>
			</DropdownMenu>
		</div>
	</div>
);

const DeleteConfirmDialog = ({
	open,
	onOpenChange,
	deleteTarget,
	selectedCount,
	onConfirm,
}) => (
	<AlertDialog open={open} onOpenChange={onOpenChange}>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>
					Are you sure you want to delete?
				</AlertDialogTitle>
				<AlertDialogDescription>
					{deleteTarget === null
						? `This will permanently delete ${selectedCount} selected users.`
						: "This will permanently delete the selected user."}
					This action cannot be undone.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>Cancel</AlertDialogCancel>
				<AlertDialogAction
					onClick={onConfirm}
					className="bg-red-600 hover:bg-red-700"
				>
					Delete
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
);

const Pagination = ({
	currentPage,
	setCurrentPage,
	pageCount,
	sortedAndFilteredUsers,
}) => (
	<div className="flex flex-col items-center justify-between mt-4 space-y-4 sm:flex-row sm:space-y-0">
		<div className="order-2 text-sm text-muted-foreground sm:order-1">
			Showing{" "}
			{Math.min(
				sortedAndFilteredUsers.length,
				(currentPage - 1) * 10 + 1
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
);

export function UserSegmentationContent(props) {
	const {
		users,
		searchTerm,
		setSearchTerm,
		selectedUsers,
		currentPage,
		setCurrentPage,
		deleteModalOpen,
		setDeleteModalOpen,
		deleteTarget,
		copied,
		impressions,
		isOpen,
		setIsOpen,
		inputRef,
		copyShareUrlToClipboard,
		sortedAndFilteredUsers,
		pageCount,
		paginatedUsers,
		requestSort,
		getSortIcon,
		handleDeleteUser,
		handleSelectUser,
		handleSelectAll,
		handleBulkAction,
		confirmDelete,
		handleCSVExport,
		handlePDFExport,
		totalColumns,
		signupGrowth,
		impressionGrowth,
		conversionRate,
		conversionGrowth,
		referralConversionRate,
		referralCounts,
		waitlistId,
		showReferrals,
	} = props;

	const sortDirection = getSortIcon();

	return (
		<>
			<MetricsCards
				totalSignups={users.length}
				signupGrowth={signupGrowth}
				totalImpressions={impressions.length}
				impressionGrowth={impressionGrowth}
				conversionRate={conversionRate}
				conversionGrowth={conversionGrowth}
				referralConversionRate={referralConversionRate}
				showReferrals={showReferrals}
			/>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>User Segmentation</CardTitle>
					<CardDescription>
						Categorize and prioritize users for early access
					</CardDescription>
				</CardHeader>

				<CardContent>
					<ActionBar
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						isOpen={isOpen}
						setIsOpen={setIsOpen}
						handlePDFExport={handlePDFExport}
						handleCSVExport={handleCSVExport}
					/>
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
									{showReferrals && (
										<TableHead className="text-center">Referral Count</TableHead>
									)}
									<TableHead>Device</TableHead>
									{showReferrals && (
										<TableHead>
											<Button
												variant="ghost"
												onClick={requestSort}
												className="hover:bg-transparent"
											>
												<div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
													Priority <SortIcon direction={sortDirection} />
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="cursor-pointer">
																	<HelpCircle className="w-4 h-4 transition-colors text-muted-foreground hover:text-primary" />
																</span>
															</TooltipTrigger>
															<TooltipContent
																className="max-w-[280px] bg-popover text-popover-foreground shadow-lg rounded-lg border border-border p-4 dark:bg-zinc-900"
																sideOffset={5}
															>
																<PriorityTooltip />
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
											</Button>
										</TableHead>
									)}
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
													<DeleteIcon />
													<span className="text-red-600">Delete User</span>
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
												<div className="flex items-center gap-2">
													<span className="hidden sm:inline">{user.name}</span>
													{user.signUpEmailSent ? (
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<MailCheck className="w-4 h-4 text-green-600" />
																</TooltipTrigger>
																<TooltipContent>Email sent</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													) : (
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Mail className="w-4 h-4 text-muted-foreground" />
																</TooltipTrigger>
																<TooltipContent>Not sent</TooltipContent>
															</Tooltip>
													</TooltipProvider>
													)}
												</div>
											</TableCell>
											{showReferrals && (
												<TableCell className="text-center">
													{referralCounts[user.id] || 0}
												</TableCell>
											)}
											<TableCell>
												{user.deviceType
													? user.deviceType.charAt(0).toUpperCase() +
													  user.deviceType.slice(1)
													: "Unknown"}
											</TableCell>
											{showReferrals && (
												<TableCell>
													<span
														className={`font-medium ml-5 ${priorityColors[user.priority]}`}
													>
														{user.priority}
													</span>
												</TableCell>
											)}
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
															<DeleteIcon />
															<span className="text-red-600">Delete</span>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<EmptyState
										inputRef={inputRef}
										copied={copied}
										copyShareUrlToClipboard={copyShareUrlToClipboard}
										waitlistId={waitlistId}
										totalColumns={totalColumns}
									/>
								)}
							</TableBody>
						</Table>
					</div>
					<Pagination
						currentPage={currentPage}
						setCurrentPage={setCurrentPage}
						pageCount={pageCount}
						sortedAndFilteredUsers={sortedAndFilteredUsers}
					/>
				</CardContent>

				<DeleteConfirmDialog
					open={deleteModalOpen}
					onOpenChange={setDeleteModalOpen}
					deleteTarget={deleteTarget}
					selectedCount={selectedUsers.length}
					onConfirm={confirmDelete}
				/>
			</Card>
		</>
	);
}
