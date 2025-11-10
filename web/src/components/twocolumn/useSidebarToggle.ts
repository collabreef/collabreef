import { useState, useEffect } from "react"

/**
 * Hook to manage sidebar state with responsive behavior
 *
 * @param breakpoint - Width in pixels below which sidebar is collapsed (default: 1024)
 * @returns Object with sidebar state and control functions
 *
 * @example
 * ```tsx
 * const { isSidebarCollapsed, toggleSidebar, setIsSidebarCollapsed } = useSidebarToggle(1024)
 * ```
 */
export const useSidebarToggle = (breakpoint = 1024) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return typeof window !== 'undefined' ? window.innerWidth < breakpoint : true
    })

    useEffect(() => {
        let previousWidth = window.innerWidth

        const handleResize = () => {
            const currentWidth = window.innerWidth

            // Only update if width actually changed (ignore height-only changes from keyboard)
            if (currentWidth !== previousWidth) {
                const shouldCollapse = currentWidth < breakpoint
                setIsSidebarCollapsed(shouldCollapse)
                previousWidth = currentWidth
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [breakpoint])

    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev)

    return {
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar
    }
}