import {
	Bookmark,
	LayoutGrid,
	Settings,
	SquarePen,
	Tag,
	Users,
} from "lucide-react";

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
					label: "Posts",
					active: pathname.includes("/posts"),
					icon: SquarePen,
					submenus: [
						{
							href: "/posts",
							label: "All Posts",
						},
						{
							href: "/posts/new",
							label: "New Post",
						},
					],
				},
				{
					href: "/categories",
					label: "Categories",
					active: pathname.includes("/categories"),
					icon: Bookmark,
				},
				{
					href: "/tags",
					label: "Tags",
					active: pathname.includes("/tags"),
					icon: Tag,
				},
			],
		},
		{
			groupLabel: "Settings",
			menus: [
				{
					href: "/users",
					label: "Users",
					active: pathname.includes("/users"),
					icon: Users,
				},
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
