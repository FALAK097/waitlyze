import { Paintbrush, Share2, Eye } from "lucide-react";

const features = [
  {
    icon: Paintbrush,
    title: "Design Your Form",
    description:
      "Create waitlist forms that match your brand with our intuitive no-code designer.",
  },
  {
    icon: Share2,
    title: "Launch Your Waitlist",
    description:
      "Embed our waitlist widget into your site or use our hosted page if you don't have a website.",
  },
  {
    icon: Eye,
    title: "Live Demo View",
    description:
      "See changes in real-time with our live demo view while editing your waitlist form.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <h2 className="mb-12 text-4xl font-bold text-center text-primary">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="p-3 mb-4 rounded-full bg-primary/10">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
