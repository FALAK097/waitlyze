import { doLogout } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { getSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Dashboard = async () => {
	const router = useRouter();
	const session = await getSession();

	if (!session) {
		return router.push("/login");
	}

	return (
		<div className="flex flex-col items-center m-4">
			<h1 className="text-3xl">Welcome, {session?.user?.name}</h1>
			<h2>{session?.user?.email}</h2>
			<Image
				src={session?.user?.image}
				alt={session?.user?.name}
				width={100}
				height={100}
				className="rounded-full"
			/>
			<form action={doLogout}>
				<Button variant="outline">Sign Out</Button>
			</form>
		</div>
	);
};

export default Dashboard;
