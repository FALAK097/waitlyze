"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getGeographicDistribution } from "@/actions/waitlist-impressions";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";

const COLORS = [
  "#FF6B4A",
  "#FF9D7A",
  "#FFC9B8",
  "#FF6B4A",
  "#FF9D7A",
];

// const COLORS = [
//   "#FF6B4A",
//   "#FF9D7A",
//   "#FFC9B8",
//   "#FFD16F",
//   "#404040",
// ];

// const COLORS = [
//   "#FF6B4A",
//   "#FF9D7A",
//   "#FFC9B8",
//   "#FFD166",
//   "#6A4C93",
// ];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const GeographicDistribution = ({ waitListId }) => {
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getGeographicDistribution(waitListId);
        if (result.success) {
          setGeoData(result.data);
        }
      } catch (error) {
        console.error("Error fetching geographic data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [waitListId]);

  if (loading) return <div>Loading geographic data...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Geographic Distribution</CardTitle>
        <CardDescription>Distribution of users by country</CardDescription>
      </CardHeader>
      <CardContent className="flex relative flex-col justify-center items-center md:flex-row">
        <ChartContainer config={geoData} className="h-[300px] w-full md:w-2/3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeShape={renderActiveShape}
                data={geoData}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="70%"
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {geoData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[geoData.indexOf(entry) % COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent className="w-[150px]" />}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 space-y-2 w-full md:mt-0 md:ml-8 md:w-1/3">
          <AnimatePresence>
            {geoData.map((entry, index) => (
              <motion.div
                key={entry.name}
                className="flex justify-between items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <span className="text-sm">{entry.name}</span>
                <div
                  className="ml-2 w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeographicDistribution;
