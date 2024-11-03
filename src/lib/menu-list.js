import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { LayoutGrid, SquarePen } from "lucide-react";

export function getMenuList(pathname) {
	return [
		{
			groupLabel: "",
			menus: [
				{
					href: "/dashboard",
					label: "Dashboard",
					active: pathname.includes("/dashboard"),
					icon: LayoutGrid,
					submenus: [],
				},
			],
		},
		{
			groupLabel: "",
			menus: [
				{
					href: "/wait-lists",
					label: "Wait Lists",
					active: pathname.includes("/wait-lists"),
					icon: HamburgerMenuIcon,
					submenus: [],
				},
			],
		},
		{
			groupLabel: "",
			menus: [
				{
					href: "/wait-lists/new",
					label: "Create Wait List",
					active: pathname.includes("/wait-lists/new"),
					icon: SquarePen,
					submenus: [],
				},
			],
		},
	];
}
