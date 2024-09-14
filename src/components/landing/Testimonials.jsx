"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Alex Johnson",
    role: "Startup Founder",
    content:
      "This tool helped us launch at the perfect time, resulting in 3x more signups!",
    avatar: "/avatars/alex.jpg",
  },
  {
    name: "Sarah Lee",
    role: "Marketing Director",
    content:
      "The AI-powered insights have revolutionized our product launch strategy. Highly recommended!",
    avatar: "/avatars/sarah.jpg",
  },
  {
    name: "Michael Chen",
    role: "Product Manager",
    content:
      "We've seen a 40% increase in user engagement since using this platform for our launch timing.",
    avatar: "/avatars/michael.jpg",
  },
  {
    name: "Emily Rodriguez",
    role: "E-commerce Entrepreneur",
    content:
      "The precision in timing our product drops has significantly boosted our sales. It's a game-changer!",
    avatar: "/avatars/emily.jpg",
  },
  {
    name: "David Kim",
    role: "Tech Startup CEO",
    content:
      "This tool's data-driven approach gave us the confidence to launch at the right moment. Invaluable!",
    avatar: "/avatars/david.jpg",
  },
  {
    name: "Lisa Patel",
    role: "Growth Hacker",
    content:
      "The integration with our existing tools made the whole process seamless. Our launch was a huge success!",
    avatar: "/avatars/lisa.jpg",
  },
];

export default function Testimonials() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="testimonials" className="py-20 overflow-hidden bg-background">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <h2 className="mb-12 text-3xl font-bold text-center text-primary">
          What Our Users Say
        </h2>
        <div className="relative">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`transform transition-all duration-1000 ${
                  mounted
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <Card className="h-full">
                  <CardContent className="flex flex-col justify-between h-full p-6">
                    <div>
                      <p className="mb-4 italic text-muted-foreground">
                        &quot;{testimonial.content}&quot;
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10 mr-4">
                        <AvatarImage
                          src={testimonial.avatar}
                          alt={testimonial.name}
                        />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{testimonial.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          {/* Floating effect elements */}
          <div className="absolute top-0 left-0 rounded-full w-72 h-72 bg-primary/5 mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 rounded-full w-72 h-72 bg-secondary/5 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute rounded-full -bottom-8 left-20 w-72 h-72 bg-accent/5 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>
    </section>
  );
}
