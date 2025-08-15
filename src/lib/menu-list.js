import { GripIcon, LayersIcon } from "@/components/shared/icons";
import { KeyIcon } from "lucide-react";

export function getMenuList(pathname) {
	return [
		{
			groupLabel: "",
			menus: [
				{
					href: "/dashboard",
					label: "Dashboard",
					active: pathname === "/dashboard",
					icon: GripIcon,
					submenus: [],
				},
			],
		},
		{
			groupLabel: "",
			menus: [
				{
					href: "/wait-lists",
					label: "WaitLists",
					active:
						pathname === "/wait-lists" ||
						(pathname.startsWith("/wait-lists") &&
							pathname !== "/wait-lists/new"),
					icon: LayersIcon,
					submenus: [],
				},
			],
		},
		{
			groupLabel: "Developer",
			menus: [
				{
					href: "/api-keys",
					label: "API Keys",
					active: pathname === "/api-keys",
					icon: KeyIcon,
					submenus: [],
				},
			],
		},
	];
}
