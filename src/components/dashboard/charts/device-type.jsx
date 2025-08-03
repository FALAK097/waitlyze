import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getWaitlistImpressions } from "@/actions/waitlist-impressions";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = [
  {
    dataKey: "desktop",
    label: "Desktop",
    fill: "#FF6B4A",
  },
  {
    dataKey: "mobile",
    label: "Mobile",
    fill: "#FF9D7A",
  },
  {
    dataKey: "tablet",
    label: "Tablet",
    fill: "#FFC9B8",
  },
];

export const DeviceType = ({ waitListId }) => {
  const [impressions, setImpressions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getWaitlistImpressions(waitListId);
        if (result.success) {
          setImpressions(result.data);
        }
      } catch (error) {
        console.error("Error fetching impressions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [waitListId]);

  const deviceData = useMemo(() => {
    const grouped = impressions.reduce((acc, imp) => {
      const date = new Date(imp.createdAt).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          desktop: 0,
          mobile: 0,
          tablet: 0,
          total: 0,
        };
      }
      const deviceType = (imp.deviceType || "desktop").toLowerCase();
      acc[date][deviceType]++;
      acc[date].total++;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [impressions]);

  if (loading) return <div>Loading device data...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Visitors by Device</CardTitle>
        <CardDescription>Chart showing total visitors by device type</CardDescription>
        <div className="flex gap-4 mt-2">
          {chartConfig.map((config) => (
            <div key={config.dataKey} className="flex gap-2 items-center">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: config.fill }}
              />
              <span className="text-sm capitalize">
                {config.label}: {impressions.filter(imp =>
                  (imp.deviceType || 'desktop').toLowerCase() === config.dataKey
                ).length}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="aspect-auto h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deviceData}
              margin={{ left: 12, right: 12 }}
              barGap={8}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="p-2 rounded-lg border shadow-sm bg-background">
                      <div className="font-medium">
                        {new Date(label).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      {payload.map((entry, index) => (
                        <div
                          key={`${entry.name}-${index}`}
                          className="flex gap-2 items-center text-sm"
                        >
                          <div
                            className="w-2 h-2 rounded"
                            style={{ backgroundColor: entry.fill }}
                          />
                          <span className="capitalize">{entry.name}:</span>
                          <span className="font-medium">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {chartConfig.map((config) => (
                <Bar
                  key={config.dataKey}
                  dataKey={config.dataKey}
                  name={config.label}
                  fill={config.fill}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
