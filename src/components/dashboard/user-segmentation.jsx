"use client";

import { getWaitlistImpressions } from "@/actions/waitlist-impressions";
import { getWaitlistReferrals } from "@/actions/waitlist-referral";
import { getWaitlistSignups } from "@/actions/waitlist-signups";
import { cn } from "@/lib/utils";
import { priorityColors } from "@/utils/user";
import { saveAs } from "file-saver";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileJson,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  MoreVertical,
  MailCheck,
  Mail,
} from "lucide-react";
import Papa from "papaparse";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ActivityIcon,
  DeleteIcon,
  DownloadIcon,
  EyeOffIcon,
  SearchIcon,
  TrendingUpIcon,
  UsersIcon,
} from "../shared/icons";
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

export const UserSegmentation = ({ waitlist }) => {
  const waitlistId = waitlist?.id;
  const showReferrals = waitlist?.showReferrals ?? true;

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
        const failedDeletes = results.filter((result) => result.status === "rejected");

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

  const totalColumns = showReferrals ? 7 : 5;

  const metricsGridClass = showReferrals
    ? "grid gap-4 my-4 md:grid-cols-2 lg:grid-cols-4"
    : "grid gap-4 my-4 md:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <div className={metricsGridClass}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Sign-ups
            </CardTitle>
            <UsersIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {getMonthlyGrowthPercentage() > 0 ? "+" : ""}
              {getMonthlyGrowthPercentage()}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Impressions
            </CardTitle>
            <EyeOffIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{impressions.length}</div>
            <p className="text-xs text-muted-foreground">
              {getMonthlyImpressionGrowthPercentage() > 0 ? "+" : ""}
              {getMonthlyImpressionGrowthPercentage()}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUpIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getConversionRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {getMonthlyConversionRate() > 0 ? "+" : ""}
              {getMonthlyConversionRate()}% from last month
            </p>
          </CardContent>
        </Card>
        {showReferrals && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Referral Conversion Rate
              </CardTitle>
              <ActivityIcon />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getReferralConversionRate()}%
              </div>
              <p className="text-xs text-muted-foreground">
                Conversion rate from referrals
              </p>
            </CardContent>
          </Card>
        )}
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
                      <motion.div
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
                      </motion.div>
                    </DropdownMenuContent>
                  )}
                </AnimatePresence>
              </DropdownMenu>
            </div>
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
                          Priority {getSortIcon()}
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
                          {Boolean(user.signUpEmailSent) ? (
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
                            className={`font-medium ml-5 ${priorityColors[user.priority]
                              }`}
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
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={totalColumns} className="h-[400px] p-0">
                      <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
                        <div className="p-4 rounded-full bg-primary/10">
                          <UsersIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2 text-center">
                          <h3 className="text-2xl font-semibold tracking-tight">
                            No users yet
                          </h3>
                          <p className="text-muted-foreground">
                            Don't be shy, invite users to your waitlist
                          </p>
                        </div>
                        <div className="w-full max-w-md space-y-4">
                          <div className="relative">
                            <Input
                              ref={inputRef}
                              readOnly
                              className="pr-12 font-mono text-sm"
                              defaultValue={`${window.location.origin}/forms/${waitlistId}`}
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
                                    <div
                                      className={cn(
                                        "absolute inset-0 flex items-center justify-center transition-all duration-300",
                                        copied
                                          ? "scale-100 opacity-100"
                                          : "scale-0 opacity-0"
                                      )}
                                    >
                                      <Check
                                        className="w-4 h-4 stroke-primary"
                                        strokeWidth={3}
                                      />
                                    </div>
                                    <div
                                      className={cn(
                                        "absolute inset-0 flex items-center justify-center transition-all duration-300",
                                        copied
                                          ? "scale-0 opacity-0"
                                          : "scale-100 opacity-100"
                                      )}
                                    >
                                      <Copy className="w-4 h-4" />
                                    </div>
                                    <span className="sr-only">
                                      {copied ? "Copied" : "Copy to clipboard"}
                                    </span>
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
                            Share this link to invite users to your waitlist 🚀
                          </p>
                        </div>
                      </div>
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
