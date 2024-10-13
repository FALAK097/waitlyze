import { LayoutGrid, Settings, SquarePen } from "lucide-react";

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
			groupLabel: "Contents",
			menus: [
				{
					href: "",
					label: "Wait Lists",
					active: pathname.includes("/wait-lists"),
					icon: SquarePen,
					submenus: [
						{
							href: "/wait-lists",
							label: "All Wait Lists",
						},
						{
							href: "/wait-lists/new",
							label: "New Wait List",
						},
					],
				},
				// TODO: Remove this
				// {
				// 	href: "/categories",
				// 	label: "Categories",
				// 	active: pathname.includes("/categories"),
				// 	icon: Bookmark,
				// },
				// {
				// 	href: "/tags",
				// 	label: "Tags",
				// 	active: pathname.includes("/tags"),
				// 	icon: Tag,
				// },
			],
		},
		{
			groupLabel: "Settings",
			menus: [
				// TODO: Remove this
				// {
				// 	href: "/users",
				// 	label: "Users",
				// 	active: pathname.includes("/users"),
				// 	icon: Users,
				// },
				{
					href: "/account",
					label: "Account",
					active: pathname.includes("/account"),
					icon: Settings,
				},
			],
		},
	];
}
