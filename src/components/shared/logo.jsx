export default function Logo({ className = "" }) {
	return (
		<div className={`flex items-center ${className}`}>
			<span className="text-2xl font-bold text-primary">Waitlist</span>
		</div>
	);
}
