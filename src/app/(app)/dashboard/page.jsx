import Link from "next/link";

import { ContentLayout } from "@/components/dashboard/content-layout";
import DashboardCard from "@/components/dashboard/dashboard-card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
	return (
		<>
			<ContentLayout title="Dashboard">
				<div className="flex items-center justify-between">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link href="/dashboard">Home</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Dashboard</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<div className="flex items-center space-x-4">
						<Select defaultValue="default-waitlist">
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Select a waitlist" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem className="cursor-pointer" value="default-waitlist">
									Default Waitlist
								</SelectItem>
								<SelectItem className="cursor-pointer" value="product-launch">
									Product Launch
								</SelectItem>
								<SelectItem className="cursor-pointer" value="beta-testing">
									Beta Testing
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</ContentLayout>
			<DashboardCard />
		</>
	);
}
