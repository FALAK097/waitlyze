"use client";

import { getWaitlistImpressions } from "@/actions/waitlist-impressions";
import { getWaitlistReferrals } from "@/actions/waitlist-referral";
import { getWaitlistSignups } from "@/actions/waitlist-signups";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import Papa from "papaparse";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

export function useUserSegmentation(waitlistId, showReferrals) {
	const [users, setUsers] = useState([]);
	const [lastMonthUsers, setLastMonthUsers] = useState([]);
	const [referralCounts, setReferralCounts] = useState({});
	const [totalReferrals, setTotalReferrals] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [copied, setCopied] = useState(false);
	const [impressions, setImpressions] = useState([]);
	const [lastMonthImpressions, setLastMonthImpressions] = useState([]);
	const inputRef = useRef(null);
	const [sortConfig, setSortConfig] = useState({
		key: null,
		direction: null,
	});
	const usersPerPage = 10;
	const [isOpen, setIsOpen] = useState(false);

	const copyShareUrlToClipboard = () => {
		if (inputRef.current) {
			const url = `${window.location.origin}/forms/${waitlistId}`;
			navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	};

	const sortedAndFilteredUsers = useMemo(() => {
		let sortableUsers = [...users];
		if (searchTerm) {
			sortableUsers = sortableUsers.filter(
				(user) =>
					user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.priority.toLowerCase().includes(searchTerm.toLowerCase())
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
		currentPage * usersPerPage
	);

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
		if (sortConfig.direction === null) return null;
		return sortConfig.direction;
	};

	const handleDeleteUser = (userId) => {
		setDeleteTarget(userId);
		setDeleteModalOpen(true);
	};

	const handleSelectUser = (userId) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId]
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
					selectedUsers.includes(user.id)
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

	const confirmDelete = async () => {
		try {
			if (deleteTarget === null) {
				const deletePromises = selectedUsers.map((userId) =>
					fetch(`/api/signups/${userId}`, { method: "DELETE" })
				);

				const results = await Promise.allSettled(deletePromises);
				const failedDeletes = results.filter(
					(result) => result.status === "rejected"
				);

				if (failedDeletes.length > 0) {
					throw new Error(`Failed to delete ${failedDeletes.length} users`);
				}

				setUsers(users.filter((user) => !selectedUsers.includes(user.id)));
				setSelectedUsers([]);
				toast.success("Selected users deleted successfully");
			} else {
				const response = await fetch(`/api/signups/${deleteTarget}`, {
					method: "DELETE",
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || "Failed to delete user");
				}

				setUsers(users.filter((user) => user.id !== deleteTarget));
				setSelectedUsers(selectedUsers.filter((id) => id !== deleteTarget));
				toast.success("User deleted successfully");
			}
		} catch (error) {
			console.error("Error deleting user(s):", error);
			toast.error(error.message || "Failed to delete user(s)");
		} finally {
			setDeleteModalOpen(false);
			setDeleteTarget(null);
		}
	};

	const handleCSVExport = () => {
		const csv = Papa.unparse(users);
		const blob = new Blob([csv], { type: "text/csv" });
		saveAs(blob, "users.csv");
	};

	const handlePDFExport = () => {
		const doc = new jsPDF();
		let yPosition = 20;
		const margin = 14;
		const lineHeight = 10;

		doc.setFontSize(16);
		doc.text("User Segmentation Report", margin, yPosition);
		yPosition += lineHeight * 2;

		doc.setFontSize(8);
		doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
		yPosition += lineHeight * 2;

		doc.setFontSize(10);
		doc.setFont(undefined, "bold");
		doc.text("Email", margin, yPosition);
		doc.text("Device", margin + 70, yPosition);
		doc.text("Priority", margin + 100, yPosition);
		if (showReferrals) doc.text("Referrals", margin + 130, yPosition);
		yPosition += lineHeight;
		doc.setFont(undefined, "normal");

		for (const user of sortedAndFilteredUsers) {
			if (yPosition >= doc.internal.pageSize.height - 30) {
				doc.addPage();
				yPosition = 20;
			}
			try {
				const email = (user.name || "N/A").substring(0, 35);
				const device = (user.device || "N/A").substring(0, 15);
				const priority = user.priority || "N/A";
				const referralCount = referralCounts[user.id] || 0;
				doc.text(email, margin, yPosition);
				doc.text(device, margin + 70, yPosition);
				if (showReferrals) doc.text(priority, margin + 100, yPosition);
				if (showReferrals) doc.text(String(referralCount), margin + 130, yPosition);
				yPosition += lineHeight;
			} catch (error) {
				console.error("Error adding user to PDF:", error);
			}
		}

		yPosition += lineHeight * 2;
		doc.setFont(undefined, "bold");
		doc.text("Summary", margin, yPosition);
		yPosition += lineHeight;

		doc.setFont(undefined, "normal");
		doc.text(`Total Users: ${users.length}`, margin, yPosition);
		yPosition += lineHeight;
		doc.text(`Total Referrals: ${totalReferrals}`, margin, yPosition);
		yPosition += lineHeight;

		if (impressions.length > 0) {
			const conversionRate = (
				(users.length / impressions.length) *
				100
			).toFixed(1);
			doc.text(`Conversion Rate: ${conversionRate}%`, margin, yPosition);
		}

		try {
			doc.save(
				`user-segmentation-report-${new Date().toISOString().split("T")[0]}.pdf`
			);
		} catch (error) {
			console.error("Error saving PDF:", error);
			toast.error("There was an error generating the PDF. Please try again.");
		}
	};

	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true);
				const signupsResult = await getWaitlistSignups(waitlistId);

				if (signupsResult.success) {
					const currentDate = new Date();
					const lastMonth = new Date(
						currentDate.setMonth(currentDate.getMonth() - 1)
					);

					const currentUsers = signupsResult.data;
					const lastMonthSignups = signupsResult.data.filter((user) => {
						const signupDate = new Date(user.createdAt);
						return signupDate <= lastMonth;
					});
					setUsers(currentUsers);
					setLastMonthUsers(lastMonthSignups);
				} else {
					setError(signupsResult.error);
				}

				const impressionsResult = await getWaitlistImpressions(waitlistId);

				if (impressionsResult.success) {
					const currentImpressions = impressionsResult.data;
					const currentDate = new Date();
					const lastMonth = new Date(
						currentDate.setMonth(currentDate.getMonth() - 1)
					);
					const lastMonthImpressions = currentImpressions.filter(
						(impression) => {
							const impressionDate = new Date(impression.createdAt);
							return impressionDate <= lastMonth;
						}
					);

					setImpressions(currentImpressions);
					setLastMonthImpressions(lastMonthImpressions);
				} else {
					setError(impressionsResult.error);
				}

				const referralsResult = await getWaitlistReferrals(waitlistId);
				if (referralsResult.success) {
					let totalReferrals = 0;
					const counts = {};
					for (const referral of referralsResult.data) {
						totalReferrals += referral._count.signUpId;
						counts[referral.referredById] = referral._count.signUpId;
					}
					setReferralCounts(counts);
					setTotalReferrals(totalReferrals);
				} else {
					setError(referralsResult.error);
				}
			} catch (err) {
				setError("Please Select a Waitlist");
				console.error(err);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [waitlistId]);

	const getMonthlyGrowthPercentage = () => {
		if (lastMonthUsers.length === 0 && users.length > 0) {
			return 100;
		}
		if (lastMonthUsers.length === 0) return 0;

		const growth =
			((users.length - lastMonthUsers.length) / lastMonthUsers.length) * 100;
		return growth.toFixed(1);
	};

	const getMonthlyImpressionGrowthPercentage = () => {
		if (lastMonthImpressions.length === 0 && impressions.length > 0) {
			return 100;
		}
		if (lastMonthImpressions.length === 0) return 0;

		const growth =
			((impressions.length - lastMonthImpressions.length) /
				lastMonthImpressions.length) *
			100;
		return growth.toFixed(1);
	};

	const getConversionRate = () => {
		if (impressions.length === 0) return 0;
		const rate = (users.length / impressions.length) * 100;
		return rate.toFixed(1);
	};

	const getMonthlyConversionRate = () => {
		if (lastMonthImpressions.length === 0 && impressions.length > 0) {
			return 100;
		}

		if (lastMonthImpressions.length === 0) return 0;

		const lastMonthRate =
			(lastMonthUsers.length / lastMonthImpressions.length) * 100;
		const currentRate = (users.length / impressions.length) * 100;

		const growth = ((currentRate - lastMonthRate) / lastMonthRate) * 100;
		return growth.toFixed(1);
	};

	const getReferralConversionRate = () => {
		if (impressions.length === 0) return 0;
		const rate = (totalReferrals / impressions.length) * 100;
		return rate.toFixed(1);
	};

	const totalColumns = showReferrals ? 7 : 5;

	const signupGrowth = getMonthlyGrowthPercentage();
	const impressionGrowth = getMonthlyImpressionGrowthPercentage();
	const conversionRate = getConversionRate();
	const conversionGrowth = getMonthlyConversionRate();
	const referralConversionRate = getReferralConversionRate();

	return {
		users,
		loading,
		error,
		searchTerm,
		setSearchTerm,
		selectedUsers,
		currentPage,
		setCurrentPage,
		deleteModalOpen,
		setDeleteModalOpen,
		deleteTarget,
		setDeleteTarget,
		copied,
		impressions,
		isOpen,
		setIsOpen,
		inputRef,
		sortConfig,
		usersPerPage,
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
	};
}
