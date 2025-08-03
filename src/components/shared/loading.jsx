"use client";

import { BounceLoader } from "react-spinners";

import Box from "../box";

const Loading = () => {
	return (
		<Box className="flex justify-center items-center h-full bg-transparent">
			<BounceLoader color="#FF6B4A" size={40} />
		</Box>
	);
};

export default Loading;
