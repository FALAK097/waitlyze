"use client";

import { ActivityIcon, EyeOffIcon, TrendingUpIcon, UsersIcon } from "../shared/icons";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const MetricsCards = ({
  totalSignups,
  signupGrowth,
  totalImpressions,
  impressionGrowth,
  conversionRate,
  conversionGrowth,
  referralConversionRate,
  showReferrals,
}) => {
  const metricsGridClass = showReferrals
    ? "grid gap-4 my-4 md:grid-cols-2 lg:grid-cols-4"
    : "grid gap-4 my-4 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={metricsGridClass}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Total Sign-ups
          </CardTitle>
          <UsersIcon />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSignups}</div>
          <p className="text-xs text-muted-foreground">
            {signupGrowth > 0 ? "+" : ""}
            {signupGrowth}% from last month
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
          <div className="text-2xl font-bold">{totalImpressions}</div>
          <p className="text-xs text-muted-foreground">
            {impressionGrowth > 0 ? "+" : ""}
            {impressionGrowth}% from last month
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
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {conversionGrowth > 0 ? "+" : ""}
            {conversionGrowth}% from last month
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
              {referralConversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Conversion rate from referrals
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
