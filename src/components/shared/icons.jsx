"use client";

import { AnimatePresence, motion, useAnimation } from "framer-motion";
import {
	AlertTriangle,
	ArrowRight,
	ArrowUpRight,
	BookOpen,
	Check,
	ChevronLeft,
	ChevronRight,
	Copy,
	File,
	FileText,
	Flame,
	HelpCircle,
	Home,
	Image,
	Laptop,
	LayoutPanelLeft,
	LineChart,
	Loader2,
	MessagesSquare,
	Moon,
	MoreVertical,
	Package,
	Plus,
	Search,
	Settings,
	SunMedium,
	Trash2,
	User,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Icons = {
	add: Plus,
	arrowRight: ArrowRight,
	arrowUpRight: ArrowUpRight,
	chevronLeft: ChevronLeft,
	chevronRight: ChevronRight,
	bookOpen: BookOpen,
	check: Check,
	close: X,
	copy: Copy,
	dashboard: LayoutPanelLeft,
	ellipsis: MoreVertical,
	gitHub: ({ ...props }) => (
		// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
		<svg
			focusable="false"
			data-prefix="fab"
			data-icon="github"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 496 512"
			{...props}
		>
			<path
				fill="currentColor"
				d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
			/>
		</svg>
	),
	google: ({ ...props }) => (
		// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
		<svg
			focusable="false"
			data-prefix="fab"
			data-icon="google"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 488 512"
			{...props}
		>
			<path
				d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
				fill="currentColor"
			/>
		</svg>
	),
	help: HelpCircle,
	home: Home,
	laptop: Laptop,
	lineChart: LineChart,
	logo: Flame,
	media: Image,
	messages: MessagesSquare,
	moon: Moon,
	page: File,
	package: Package,
	post: FileText,
	search: Search,
	settings: Settings,
	spinner: Loader2,
	sun: SunMedium,
	trash: Trash2,
	twitter: ({ ...props }) => (
		// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			focusable="false"
			data-prefix="fab"
			data-icon="twitter"
			role="img"
			{...props}
		>
			<path
				d="M14.258 10.152L23.176 0h-2.113l-7.747 8.813L7.133 0H0l9.352 13.328L0 23.973h2.113l8.176-9.309 6.531 9.309h7.133zm-2.895 3.293l-.949-1.328L2.875 1.56h3.246l6.086 8.523.945 1.328 7.91 11.078h-3.246zm0 0"
				fill="currentColor"
			/>
		</svg>
	),
	user: User,
	warning: AlertTriangle,
};

const dotVariants = {
	normal: {
		opacity: 1,
	},
	animate: (custom) => ({
		opacity: [1, 0, 0, 1, 1, 0, 0, 1],
		transition: {
			opacity: {
				times: [
					0,
					0.1,
					0.1 + custom * 0.1,
					0.1 + custom * 0.1 + 0.1,
					0.5,
					0.6,
					0.6 + custom * 0.1,
					0.6 + custom * 0.1 + 0.1,
				],
				duration: 1.5,
			},
		},
	}),
};

const MessageCircleMoreIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center overflow-hidden transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="25"
				height="25"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Message Circle More Icon"
			>
				<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
				<motion.path
					d="M8 12h.01"
					variants={dotVariants}
					animate={controls}
					custom={0}
				/>
				<motion.path
					d="M12 12h.01"
					variants={dotVariants}
					animate={controls}
					custom={1}
				/>
				<motion.path
					d="M16 12h.01"
					variants={dotVariants}
					animate={controls}
					custom={2}
				/>
			</svg>
		</div>
	);
};

export { MessageCircleMoreIcon };

const arrowVariants = {
	normal: { y: 0 },
	animate: {
		y: 2,
		transition: {
			type: "spring",
			stiffness: 200,
			damping: 10,
			mass: 1,
		},
	},
};

const DownloadIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Download Icon"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<motion.g variants={arrowVariants} animate={controls}>
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" x2="12" y1="15" y2="3" />
				</motion.g>
			</svg>
		</div>
	);
};

export { DownloadIcon };

const lidVariants = {
	normal: { y: 0 },
	animate: { y: -1.1 },
};

const springTransition = {
	type: "spring",
	stiffness: 500,
	damping: 30,
};

const DeleteIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center mr-2 text-red-600 transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Delete Icon"
			>
				<motion.g
					variants={lidVariants}
					animate={controls}
					transition={springTransition}
				>
					<path d="M3 6h18" />
					<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
				</motion.g>
				<motion.path
					d="M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8"
					variants={{
						normal: { d: "M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8" },
						animate: { d: "M19 9v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V9" },
					}}
					animate={controls}
					transition={springTransition}
				/>
				<motion.line
					x1="10"
					x2="10"
					y1="11"
					y2="17"
					variants={{
						normal: { y1: 11, y2: 17 },
						animate: { y1: 11.5, y2: 17.5 },
					}}
					animate={controls}
					transition={springTransition}
				/>
				<motion.line
					x1="14"
					x2="14"
					y1="11"
					y2="17"
					variants={{
						normal: { y1: 11, y2: 17 },
						animate: { y1: 11.5, y2: 17.5 },
					}}
					animate={controls}
					transition={springTransition}
				/>
			</svg>
		</div>
	);
};

export { DeleteIcon };

const Delete2Icon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Delete Icon"
			>
				<motion.g
					variants={lidVariants}
					animate={controls}
					transition={springTransition}
				>
					<path d="M3 6h18" />
					<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
				</motion.g>
				<motion.path
					d="M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8"
					variants={{
						normal: { d: "M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8" },
						animate: { d: "M19 9v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V9" },
					}}
					animate={controls}
					transition={springTransition}
				/>
				<motion.line
					x1="10"
					x2="10"
					y1="11"
					y2="17"
					variants={{
						normal: { y1: 11, y2: 17 },
						animate: { y1: 11.5, y2: 17.5 },
					}}
					animate={controls}
					transition={springTransition}
				/>
				<motion.line
					x1="14"
					x2="14"
					y1="11"
					y2="17"
					variants={{
						normal: { y1: 11, y2: 17 },
						animate: { y1: 11.5, y2: 17.5 },
					}}
					animate={controls}
					transition={springTransition}
				/>
			</svg>
		</div>
	);
};

export { Delete2Icon };

const defaultTransition = {
	type: "spring",
	stiffness: 160,
	damping: 17,
	mass: 1,
};

const CopyIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center p-2 transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Copy Icon"
			>
				<motion.rect
					width="14"
					height="14"
					x="8"
					y="8"
					rx="2"
					ry="2"
					variants={{
						normal: { translateY: 0, translateX: 0 },
						animate: { translateY: -3, translateX: -3 },
					}}
					animate={controls}
					transition={defaultTransition}
				/>
				<motion.path
					d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
					variants={{
						normal: { x: 0, y: 0 },
						animate: { x: 3, y: 3 },
					}}
					transition={defaultTransition}
					animate={controls}
				/>
			</svg>
		</div>
	);
};

export { CopyIcon };

const svgVariants = {
	animate: {
		x: 0,
		y: 0,
		translateX: [0, 2, 0],
		translateY: [0, -2, 0],
		transition: {
			duration: 0.5,
		},
	},
};

const pathVariants = {
	normal: {
		opacity: 1,
		pathLength: 1,
		transition: {
			duration: 0.4,
			opacity: { duration: 0.1 },
		},
	},
	animate: {
		opacity: [0, 1],
		pathLength: [0, 1],
		pathOffset: [1, 0],
		transition: {
			duration: 0.4,
			opacity: { duration: 0.1 },
		},
	},
};

const arrowUpVariants = {
	normal: {
		opacity: 1,
		pathLength: 1,
		transition: {
			delay: 0.3,
			duration: 0.3,
			opacity: { duration: 0.1, delay: 0.3 },
		},
	},
	animate: {
		opacity: [0, 1],
		pathLength: [0, 1],
		pathOffset: [0.5, 0],
		transition: {
			delay: 0.3,
			duration: 0.3,
			opacity: { duration: 0.1, delay: 0.3 },
		},
	},
};

const TrendingUpIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				variants={svgVariants}
				initial="normal"
				animate={controls}
				role="img"
				aria-label="Trending Up Icon"
			>
				<motion.polyline
					points="22 7 13.5 15.5 8.5 10.5 2 17"
					variants={pathVariants}
					initial="normal"
					animate={controls}
				/>
				<motion.polyline
					points="16 7 22 7 22 13"
					variants={arrowUpVariants}
					initial="normal"
					animate={controls}
				/>
			</motion.svg>
		</div>
	);
};

export { TrendingUpIcon };

const pathUserVariants = {
	normal: {
		translateX: 0,
		transition: {
			type: "spring",
			stiffness: 200,
			damping: 13,
		},
	},
	animate: {
		translateX: [-6, 0],
		transition: {
			delay: 0.1,
			type: "spring",
			stiffness: 200,
			damping: 13,
		},
	},
};

const UsersIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Users Icon"
			>
				<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
				<circle cx="9" cy="7" r="4" />
				<motion.path
					d="M22 21v-2a4 4 0 0 0-3-3.87"
					variants={pathUserVariants}
					animate={controls}
				/>
				<motion.path
					d="M16 3.13a4 4 0 0 1 0 7.75"
					variants={pathUserVariants}
					animate={controls}
				/>
			</svg>
		</div>
	);
};

export { UsersIcon };

const SearchIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="absolute flex items-center justify-center p-2 overflow-hidden transition-colors duration-200 transform -translate-y-1/2 rounded-md cursor-pointer select-none left-2 top-1/2"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				variants={{
					normal: { x: 0, y: 0 },
					animate: {
						x: [0, 0, -3, 0],
						y: [0, -4, 0, 0],
					},
				}}
				transition={{
					duration: 1,
					bounce: 0.3,
				}}
				animate={controls}
				role="img"
				aria-label="Search Icon"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.3-4.3" />
			</motion.svg>
		</div>
	);
};

export { SearchIcon };

const pathLogOutVariants = {
	animate: {
		x: 2,
		translateX: [0, -3, 0],
		transition: {
			duration: 0.4,
		},
	},
};

const LogoutIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Logout Icon"
			>
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
				<motion.polyline
					points="16 17 21 12 16 7"
					variants={pathLogOutVariants}
					animate={controls}
				/>
				<motion.line
					x1="21"
					x2="9"
					y1="12"
					y2="12"
					variants={pathLogOutVariants}
					animate={controls}
				/>
			</svg>
		</div>
	);
};

export { LogoutIcon };

const penVariants = {
	normal: {
		rotate: 0,
		x: 0,
		y: 0,
	},
	animate: {
		rotate: [-0.5, 0.5, -0.5],
		x: [0, -1, 1.5, 0],
		y: [0, 1.5, -1, 0],
	},
};

const SquarePenIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Square Pen Icon"
			>
				<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
				<motion.path
					d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
					variants={penVariants}
					animate={controls}
					transition={{
						duration: 0.5,
						repeat: 1,
						ease: "easeInOut",
					}}
				/>
			</svg>
		</div>
	);
};

export { SquarePenIcon };

const variants = {
	normal: {
		opacity: 1,
		pathLength: 1,
		pathOffset: 0,
		transition: {
			duration: 0.4,
			opacity: { duration: 0.1 },
		},
	},
	animate: {
		opacity: [0, 1],
		pathLength: [0, 1],
		pathOffset: [1, 0],
		transition: {
			duration: 0.6,
			ease: "linear",
			opacity: { duration: 0.1 },
		},
	},
};

const ActivityIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => {
				controls.start("animate");
			}}
			onMouseLeave={() => {
				controls.start("normal");
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Activity Icon"
			>
				<motion.path
					variants={variants}
					animate={controls}
					initial="normal"
					d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
				/>
			</svg>
		</div>
	);
};

export { ActivityIcon };

const variantsRocket = {
	normal: {
		x: 0,
		y: 0,
	},
	animate: {
		x: [0, 0, -3, 2, -2, 1, -1, 0],
		y: [0, -3, 0, -2, -3, -1, -2, 0],
		transition: {
			duration: 6,
			ease: "easeInOut",
			repeat: Number.POSITIVE_INFINITY,
			repeatType: "reverse",
			times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
		},
	},
};

const fireVariants = {
	normal: {
		d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
	},
	animate: {
		d: [
			"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
			"M4.5 16.5c-1.5 1.26-3 5.5-3 5.5s4.74-1 6-2.5c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
			"M4.5 16.5c-1.5 1.26-2.2 4.8-2.2 4.8s3.94-0.3 5.2-1.8c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
			"M4.5 16.5c-1.5 1.26-2.8 5.2-2.8 5.2s4.54-0.7 5.8-2.2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
			"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
		],
		transition: {
			duration: 2,
			ease: [0.4, 0, 0.2, 1],
			repeat: Number.POSITIVE_INFINITY,
			times: [0, 0.2, 0.5, 0.8, 1],
		},
	},
};

const RocketIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => {
				controls.start("animate");
			}}
			onMouseLeave={() => {
				controls.start("normal");
			}}
		>
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				variants={variantsRocket}
				animate={controls}
				role="img"
				aria-label="Rocket Icon"
			>
				<motion.path
					d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
					variants={fireVariants}
					animate={controls}
				/>
				<path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
				<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
				<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
			</motion.svg>
		</div>
	);
};

export { RocketIcon };

const defaultLayersTransition = {
	type: "spring",
	stiffness: 100,
	damping: 14,
	mass: 1,
};

const LayersIcon = () => {
	const controls = useAnimation();

	const handleMouseEnter = async () => {
		await controls.start("firstState");
		await controls.start("secondState");
	};

	const handleMouseLeave = () => {
		controls.start("normal");
	};

	useEffect(() => {
		controls.start("normal");
	}, [controls]);

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Layers Icon"
			>
				<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
				<motion.path
					d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
					variants={{
						normal: { y: 0 },
						firstState: { y: -9 },
						secondState: { y: 0 },
					}}
					animate={controls}
					transition={defaultLayersTransition}
				/>
				<motion.path
					d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
					variants={{
						normal: { y: 0 },
						firstState: { y: -5 },
						secondState: { y: 0 },
					}}
					animate={controls}
					transition={defaultLayersTransition}
				/>
			</svg>
		</div>
	);
};

export { LayersIcon };

const circles = [
	{ cx: 19, cy: 5 }, // Top right
	{ cx: 12, cy: 5 }, // Top middle
	{ cx: 19, cy: 12 }, // Middle right
	{ cx: 5, cy: 5 }, // Top left
	{ cx: 12, cy: 12 }, // Center
	{ cx: 19, cy: 19 }, // Bottom right
	{ cx: 5, cy: 12 }, // Middle left
	{ cx: 12, cy: 19 }, // Bottom middle
	{ cx: 5, cy: 19 }, // Bottom left
];

const GripIcon = () => {
	const [isHovered, setIsHovered] = useState(false);
	const controls = useAnimation();

	useEffect(() => {
		const animateCircles = async () => {
			if (isHovered) {
				await controls.start((i) => ({
					opacity: 0.3,
					transition: {
						delay: i * 0.1,
						duration: 0.2,
					},
				}));
				await controls.start((i) => ({
					opacity: 1,
					transition: {
						delay: i * 0.1,
						duration: 0.2,
					},
				}));
			}
		};

		animateCircles();
	}, [isHovered, controls]);

	return (
		<motion.div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Grip Icon"
			>
				<AnimatePresence>
					{circles.map((circle, index) => (
						<motion.circle
							key={`${circle.cx}-${circle.cy}`}
							cx={circle.cx}
							cy={circle.cy}
							r="1"
							initial="initial"
							variants={{
								initial: {
									opacity: 1,
								},
							}}
							animate={controls}
							exit="initial"
							custom={index}
						/>
					))}
				</AnimatePresence>
			</svg>
		</motion.div>
	);
};

export { GripIcon };

const sparkleVariants = {
	initial: {
		y: 0,
		fill: "none",
	},
	hover: {
		y: [0, -1, 0, 0],
		fill: "currentColor",
		transition: {
			duration: 1,
			bounce: 0.3,
		},
	},
};

const starVariants = {
	initial: {
		opacity: 1,
		x: 0,
		y: 0,
	},
	blink: () => ({
		opacity: [0, 1, 0, 0, 0, 0, 1],
		transition: {
			duration: 2,
			type: "spring",
			stiffness: 70,
			damping: 10,
			mass: 0.4,
		},
	}),
};

const SparklesIcon = () => {
	const starControls = useAnimation();
	const sparkleControls = useAnimation();

	return (
		<div
			className="flex items-center justify-center p-2 transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => {
				sparkleControls.start("hover");
				starControls.start("blink", { delay: 1 });
			}}
			onMouseLeave={() => {
				sparkleControls.start("initial");
				starControls.start("initial");
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Sparkles Icon"
			>
				<motion.path
					d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
					variants={sparkleVariants}
					animate={sparkleControls}
				/>
				<motion.path
					d="M20 3v4"
					variants={starVariants}
					animate={starControls}
				/>
				<motion.path
					d="M22 5h-4"
					variants={starVariants}
					animate={starControls}
				/>
				<motion.path
					d="M4 17v2"
					variants={starVariants}
					animate={starControls}
				/>
				<motion.path
					d="M5 18H3"
					variants={starVariants}
					animate={starControls}
				/>
			</svg>
		</div>
	);
};

export { SparklesIcon };

const pathCheckVariants = {
	normal: {
		opacity: 1,
		pathLength: 1,
		transition: {
			duration: 0.3,
			opacity: { duration: 0.1 },
		},
	},
	animate: {
		opacity: [0, 1],
		pathLength: [0, 1],
		transition: {
			duration: 0.4,
			opacity: { duration: 0.1 },
		},
	},
};

const CircleCheckIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Circle Check Icon"
			>
				<circle cx="12" cy="12" r="10" />
				<motion.path
					variants={pathCheckVariants}
					initial="normal"
					animate={controls}
					d="m9 12 2 2 4-4"
				/>
			</svg>
		</div>
	);
};

export { CircleCheckIcon };

const pathPlayVariants = {
	normal: {
		x: 0,
		rotate: 0,
	},
	animate: {
		x: [0, -1, 2, 0],
		rotate: [0, -10, 0, 0],
		transition: {
			duration: 0.5,
			times: [0, 0.2, 0.5, 1],
			stiffness: 260,
			damping: 20,
		},
	},
};

const PlayIcon = () => {
	const controls = useAnimation();

	return (
		<div
			className="flex items-center justify-center px-2 transition-colors duration-200 rounded-md cursor-pointer select-none"
			onMouseEnter={() => controls.start("animate")}
			onMouseLeave={() => controls.start("normal")}
		>
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="Play Icon"
			>
				<motion.polygon
					points="6 3 20 12 6 21 6 3"
					variants={pathPlayVariants}
					animate={controls}
				/>
			</motion.svg>
		</div>
	);
};

export { PlayIcon };
