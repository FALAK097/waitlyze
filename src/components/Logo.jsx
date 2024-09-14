import { Clock } from "lucide-react";

export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Clock className="w-6 h-6 mr-2 text-primary" />
      <span className="text-2xl font-bold text-primary">Waitlist</span>
    </div>
  );
}
