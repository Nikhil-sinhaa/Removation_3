/**
 * LoadingDots.tsx
 * Purpose: Animated three-dot pulsing loading indicator.
 * Used during AI image generation to show a spinner-alternative with a polished feel.
 * Connects to: Any component that needs an inline loading indicator (e.g., editor generate button).
 */

import styles from "./loading-dots.module.css";

interface LoadingDotsProps {
    /** Dot color — any valid CSS color string. Defaults to "#000". */
    color?: string;
    /** "small" renders 4×4px dots; "large" renders 5×5px dots. Defaults to "small". */
    size?: "small" | "large";
}

export default function LoadingDots({
    color = "#000",
    size = "small",
}: LoadingDotsProps) {
    return (
        <span className={size === "small" ? styles.loading2 : styles.loading}>
            <span style={{ backgroundColor: color }} />
            <span style={{ backgroundColor: color }} />
            <span style={{ backgroundColor: color }} />
        </span>
    );
}
