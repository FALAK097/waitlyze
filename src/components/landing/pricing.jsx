import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$16",
    originalPrice: "$23",
    features: [
      { name: "Up to 500 signups", available: true },
      { name: "Unlimited Projects", available: true },
      { name: "Waitlist Widget", available: true },
      { name: "Hosted Page", available: true },
      { name: "Realtime Social Proof", available: false },
      { name: "Email Verification", available: false },
      { name: "Waitlist Analytics", available: false },
      { name: "Gamified Referrals", available: false },
    ],
    highlight: false,
    color: "bg-pink-500",
  },
  {
    name: "Pro",
    price: "$35",
    originalPrice: "$50",
    features: [
      { name: "Up to 2K signups", available: true },
      { name: "Unlimited Projects", available: true },
      { name: "Waitlist Widget", available: true },
      { name: "Hosted Page", available: true },
      { name: "Realtime Social Proof", available: true },
      { name: "Email Verification", available: true },
      { name: "Waitlist Analytics", available: false },
      { name: "Gamified Referrals", available: false },
    ],
    highlight: false,
    color: "bg-purple-500",
  },
  {
    name: "Hacker",
    price: "$69",
    originalPrice: "$99",
    features: [
      { name: "Up to 5K signups", available: true },
      { name: "Unlimited Projects", available: true },
      { name: "Waitlist Widget", available: true },
      { name: "Hosted Page", available: true },
      { name: "Realtime Social Proof", available: true },
      { name: "Email Verification", available: true },
      { name: "Waitlist Analytics", available: true },
      { name: "Gamified Referrals", available: true },
    ],
    highlight: true,
    color: "bg-blue-500",
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
            <Card
              key={index}
              className={`flex flex-col transition-shadow duration-300 shadow-lg hover:shadow-xl ${
                plan.highlight ? "border-4 border-purple-500" : ""
              } relative`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 px-3 py-1 text-sm font-bold text-white bg-purple-500 rounded-bl-md">
                  MOST POPULAR
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-semibold">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline justify-center space-x-2">
                  <p className="text-3xl font-bold text-primary">
                    {plan.price}
                  </p>
                  {plan.originalPrice && (
                    <p className="text-sm line-through text-muted-foreground">
                      {plan.originalPrice}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.name === "Starter"
                    ? "One-time payment"
                    : "One-time payment"}
                </p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center">
                      {feature.available ? (
                        <Check className="w-5 h-5 mr-2 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 mr-2 text-red-500" />
                      )}
                      <span
                        className={`${
                          feature.available
                            ? "text-muted-foreground"
                            : "text-secondary line-through"
                        }`}
                      >
                        {feature.name}
                      </span>
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
