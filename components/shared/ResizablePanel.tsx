/**
 * ResizablePanel.tsx
 * Purpose: Animated container that smoothly transitions its height as children change.
 * Used in the AI generation flow to animate between the "upload" and "result" states.
 * Implementation: Uses framer-motion's layout animations (already installed in the project)
 * instead of react-use-measure to avoid dependency conflicts.
 * Connects to: Any page/component that renders conditional content (e.g., editor dream page).
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface ResizablePanelProps {
    children: ReactNode;
    /** Optional extra className for the outer container */
    className?: string;
}

/**
 * ResizablePanel wraps content and animates height changes using framer-motion layout.
 * Usage:
 *   <ResizablePanel>
 *     {showResult ? <Result /> : <UploadZone />}
 *   </ResizablePanel>
 */
export default function ResizablePanel({
    children,
    className = "",
}: ResizablePanelProps) {
    return (
        <motion.div
            layout
            className={`relative w-full overflow-hidden ${className}`}
            transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={typeof children === "string" ? children : undefined}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
