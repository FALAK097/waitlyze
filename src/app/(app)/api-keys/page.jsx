import { ApiKeysClient } from "@/components/api-keys-client";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";

export const metadata = {
    title: "API Keys",
    description: "Manage your API keys for programmatic access to Waitlyze",
};

export default async function ApiKeysPage() {
    return (
        <ContentLayout title="API Keys">
            <div className="flex justify-between items-center">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/dashboard">Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>API Keys</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <ApiKeysClient />
        </ContentLayout>
    );

}
