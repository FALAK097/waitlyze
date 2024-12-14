import { GripIcon, LayersIcon, SquarePenIcon } from "@/components/shared/icons";

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
			groupLabel: "",
			menus: [
				{
					href: "/wait-lists/new",
					label: "Create WaitList",
					active: pathname === "/wait-lists/new",
					icon: SquarePenIcon,
					submenus: [],
				},
			],
		},
	];
}
