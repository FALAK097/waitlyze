import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const CHART_COLORS = {
  primary: '#FF9D7A',
  primaryLight: '#FFC9B8',
  grid: '#E5E7EB',
  text: '#374151',
};

const groupByHour = (signups) => {
  const hours = Array(24).fill(0).map((_, i) => ({
    hour: i,
    hour12: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
    count: 0
  }));

  signups.forEach(signup => {
    const date = new Date(signup.createdAt);
    const hour = date.getHours();
    if (hours[hour]) {
      hours[hour].count++;
    }
  });

  return hours;
};

const fetchSignups = async (waitListId) => {
  const response = await fetch(`/api/signups?waitListId=${waitListId}`);
  if (!response.ok) throw new Error('Failed to fetch signups');
  const { data: signups } = await response.json();
  return signups;
};

export const InterestTime = ({ waitListId }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["interest-time", waitListId],
    queryFn: () => fetchSignups(waitListId),
    enabled: !!waitListId,
  });

  const chartData = useMemo(() => data ? groupByHour(data) : [], [data]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peak Interest Times</CardTitle>
          <CardDescription className="text-destructive">Failed to load signup data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !chartData?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peak Interest Times</CardTitle>
          <CardDescription>{isLoading ? "Loading..." : "No signup data available yet"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Interest Times</CardTitle>
        <CardDescription>When users are most active on your waitlist</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          config={{
            users: {
              label: 'Active Users',
              color: CHART_COLORS.primary,
            },
          }}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="hour12"
                tickLine={false}
                axisLine={false}
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                height={40}
                interval={2}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value) => [`${value}`, 'Signups']}
                    labelFormatter={(hour) => `Hour: ${hour}`}
                  />
                }
              />
              <Bar
                dataKey="count"
                name="Signups"
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
