import { useCallback } from "react";
import { useEffect, useRef } from "react";

const useAnimationFrame = (callback: any) => {
    const requestRef = useRef<any>();
    const previousTimeRef = useRef<number | undefined>(undefined);

    const stableCallback = useCallback(callback, [callback]);

    useEffect(() => {
        const animate = (time: number) => {
            if (previousTimeRef.current !== undefined) {
                const deltaTime = time - previousTimeRef.current;
                stableCallback(deltaTime);
            }
            previousTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [stableCallback]); // Make sure the effect runs only once
};

export { useAnimationFrame };
