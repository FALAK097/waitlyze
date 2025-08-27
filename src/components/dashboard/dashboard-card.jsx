"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DashboardCharts } from "./dashboard-charts";
import { UserSegmentation } from "./user-segmentation";
import { useQueryState } from 'nuqs';

export default function DashboardCard({ waitLists = [] }) {
  const waitListIds = waitLists.map(w => w.id);
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'signups',
    clearOnDefault: true
  });
  const [selectedWaitlistId, setSelectedWaitlistId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const savedWaitlistId = localStorage.getItem("selectedWaitlist");
    if (savedWaitlistId) {
      setSelectedWaitlistId(savedWaitlistId);
    }
  }, []);

  const handleTabChange = async (value) => {
    if (value === 'signups') {
      await setActiveTab(null);
    } else {
      await setActiveTab(value);
    }
  };

  const isUserWaitlist = (waitlistId) => waitListIds.includes(waitlistId);

  const selectedWaitlist = waitLists.find(w => w.id === selectedWaitlistId);

  return (
    <div className="lg:px-8">
      <Tabs value={activeTab || 'signups'} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="signups">Sign-ups</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="signups">
          {selectedWaitlistId && isUserWaitlist(selectedWaitlistId) ? (
            <UserSegmentation
              waitlist={selectedWaitlist}
            />
          ) : (
            <Card className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="mb-2 text-xl font-semibold">
                  No Waitlist Selected
                </h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Please select a waitlist from the dropdown{" "}
                  <br />
                  <span className="font-semibold">above</span> to view{" "}
                  <span className="font-semibold">sign-ups</span> and{" "}
                  <span className="font-semibold">analytics</span>
                  <br />
                  or
                </p>
                <Button
                  onClick={() => router.push("/wait-lists/new")}
                >
                  Create New Waitlist
                </Button>
              </motion.div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <DashboardCharts waitListId={selectedWaitlistId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
