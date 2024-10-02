"use client";

import { BounceLoader } from "react-spinners";

import Box from "../box";

const Loading = () => {
	return (
		<Box className="flex items-center justify-center h-full bg-transparent">
			<BounceLoader color="#ffcc00" size={40} />
		</Box>
	);
};

export default Loading;
