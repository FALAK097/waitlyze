import { useEffect, useRef } from "react";

export function useForwardedRef(ref) {
	const innerRef = useRef();

	useEffect(() => {
		if (!ref) return;
		if (typeof ref === "function") {
			ref(innerRef.current);
		} else {
			if (ref.current !== undefined) {
				ref.current = innerRef.current;
			}
		}
	});

	return innerRef;
}
