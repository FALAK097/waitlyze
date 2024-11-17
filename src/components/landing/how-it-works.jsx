import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Paintbrush, Rocket, Sliders } from "lucide-react";

const steps = [
	{
		icon: Paintbrush,
		title: "Design",
		description: "Use our no-code designer to create a branded waitlist form.",
		color: "bg-red-600",
	},
	{
		icon: Sliders,
		title: "Customize",
		description: "Add fields, change colors, and set up email notifications.",
		color: "bg-purple-600",
	},
	{
		icon: Eye,
		title: "Preview",
		description: "See your changes in real-time with our live demo view.",
		color: "bg-blue-600",
	},
	{
		icon: Rocket,
		title: "Launch",
		description: "Embed the form on your site or share our hosted page.",
		color: "bg-orange-600",
	},
];

export default function HowItWorks() {
	return (
		<section id="howitworks" className="py-20 bg-background">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<h2 className="mb-12 text-4xl font-bold text-center text-primary">
					How It Works
				</h2>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
					{steps.map((step, index) => (
						<Card
							key={`${step.title}-${index}`}
							className="overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
						>
							<div className={`h-2 ${step.color}`} />
							<CardHeader className="relative pt-16">
								<div
									className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-2 mt-10 rounded-full ${step.color}`}
								>
									<step.icon className="w-10 h-10 text-white" />
								</div>
								<CardTitle className="text-xl font-semibold text-center">
									{step.title}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-center text-muted-foreground">
									{step.description}
								</p>
							</CardContent>
							<div className="flex justify-center pb-6">
								<span
									className={`px-4 py-2 text-sm font-medium text-white rounded-md ${step.color}`}
								>
									Step {index + 1}
								</span>
							</div>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
