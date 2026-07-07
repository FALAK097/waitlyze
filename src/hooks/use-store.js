import { useMemo } from "react";

/**
 * Custom hook to manage state from a store.
 *
 * @template T
 * @template F
 * @param {(function((T): unknown): unknown)} store - The store function that takes a callback.
 * @param {(function(T): F)} callback - The callback function to retrieve state from the store.
 * @returns {F | undefined} The current state from the store.
 */
export const useStore = (store, callback) => {
	return useMemo(() => store(callback), [store, callback]);
};
