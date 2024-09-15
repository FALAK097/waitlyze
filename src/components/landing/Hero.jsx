import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-background">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-6xl text-primary">
            Create Stunning Waitlists in Minutes
          </h1>
          <p className="mb-8 text-xl md:text-2xl text-muted-foreground">
            Design, launch, and manage waitlists that convert visitors into
            eager customers.
          </p>
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button
              size="lg"
              className="w-full px-8 py-3 text-lg font-semibold transition-all duration-300 rounded-full shadow-lg sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl"
            >
              Start Creating
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full px-8 py-3 text-lg font-semibold transition-all duration-300 border-2 rounded-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              View Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
