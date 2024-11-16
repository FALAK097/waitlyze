import { GripIcon, LayersIcon, SquarePenIcon } from "@/components/shared/icons";

export function getMenuList(pathname) {
	return [
		{
			groupLabel: "",
			menus: [
				{
					href: "/dashboard",
					label: "Dashboard",
					active: pathname.includes("/dashboard"),
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
					label: "Wait Lists",
					active: pathname.includes("/wait-lists"),
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
					label: "Create Wait List",
					active: pathname.includes("/wait-lists/new"),
					icon: SquarePenIcon,
					submenus: [],
				},
			],
		},
	];
}
