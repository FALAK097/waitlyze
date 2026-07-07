"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Loading from "../shared/loading";
import { useUserSegmentation } from "./use-user-segmentation";
import { UserSegmentationContent } from "./user-segmentation-content";

export const UserSegmentation = ({ waitlist }) => {
	const waitlistId = waitlist?.id;
	const showReferrals = waitlist?.showReferrals ?? true;

	const state = useUserSegmentation(waitlistId, showReferrals);

	if (state.loading) {
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

	if (state.error) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Error</CardTitle>
					<p className="text-red-500">{state.error}</p>
				</CardHeader>
			</Card>
		);
	}

	return <UserSegmentationContent {...state} />;
};
