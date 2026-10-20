"use client";

import { Cancel01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    color: "from-pink-500 to-rose-500",
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
    highlight: true,
    color: "from-primary to-primary/40",
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
    highlight: false,
    color: "from-blue-500 to-cyan-500",
  },
];

export default function Pricing({ isModal = false }) {
  return (
    <section className={`${isModal ? "py-4" : "bg-background py-20"}`} id="pricing">
      <div className={`${isModal ? "" : "container mx-auto px-4 sm:px-6 lg:px-8"}`}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`${
            isModal ? "mb-6 text-2xl" : "mb-12 text-4xl"
          } bg-linear-to-r from-primary to-primary/20 bg-clip-text text-center font-bold text-transparent`}
        >
          Choose Your Plan
        </motion.h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`flex h-full flex-col transition-all duration-300 ${
                  plan.highlight ? "shadow-lg hover:shadow-xl" : "shadow hover:shadow-md"
                } relative overflow-hidden`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-linear-to-r from-primary to-primary/40 px-3 py-1 text-sm font-bold text-white">
                    Popular
                  </div>
                )}
                <div className={`h-2 bg-linear-to-r ${plan.color}`} />
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline justify-center space-x-2">
                    <p className="text-5xl font-extrabold text-primary">{plan.price}</p>
                    <p className="text-xl text-muted-foreground">/mo</p>
                  </div>
                  {plan.originalPrice && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="line-through">{plan.originalPrice}</span> Save{" "}
                      {Math.round(
                        (1 -
                          Number.parseInt(plan.price.slice(1)) /
                            Number.parseInt(plan.originalPrice.slice(1))) *
                          100,
                      )}
                      %
                    </p>
                  )}
                </CardHeader>
                <CardContent className="grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.li
                        key={feature.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: featureIndex * 0.1,
                        }}
                        className="flex items-center"
                      >
                        {feature.available ? (
                          <HugeiconsIcon
                            icon={Tick01Icon}
                            className="mr-2 h-5 w-5 text-green-500"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            className="mr-2 h-5 w-5 text-red-500"
                          />
                        )}
                        <span
                          className={`text-sm ${
                            feature.available
                              ? "text-foreground"
                              : "text-muted-foreground line-through"
                          }`}
                        >
                          {feature.name}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full bg-linear-to-r text-white ${plan.color} transition-opacity duration-300 hover:opacity-90`}
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
