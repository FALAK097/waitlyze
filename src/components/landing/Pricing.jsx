import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "$9",
    features: ["100 timed events", "Basic analytics", "Email support"],
  },
  {
    name: "Pro",
    price: "$29",
    features: [
      "Unlimited timed events",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Custom solutions",
      "Dedicated account manager",
      "24/7 phone support",
      "On-premise options",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <h2 className="mb-12 text-3xl font-bold text-center text-primary">
          Choose Your Plan
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-3xl font-bold text-primary">
                  {plan.price}
                  {plan.price !== "Custom" && (
                    <span className="text-base text-muted-foreground">
                      /month
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center">
                      <Check className="w-5 h-5 mr-2 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {plan.price === "Custom" ? "Contact Us" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
