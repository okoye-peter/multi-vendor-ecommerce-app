import React, { type ReactNode, useRef, useState, useEffect } from 'react';

// TypeScript interface for ActionDropdown props
interface ActionDropdownProps {
    children: ReactNode;
}

// Reusable Dropdown Actions Component with Fixed Positioning
const ActionDropdown: React.FC<ActionDropdownProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);

    // Update position whenever dropdown opens or on scroll/resize
    useEffect(() => {
        const updatePosition = () => {
            if (buttonRef.current && menuRef.current) {
                const buttonRect = buttonRef.current.getBoundingClientRect();
                const menuHeight = menuRef.current.offsetHeight;
                const menuWidth = 208; // 52 * 4 (w-52 in Tailwind)
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;

                // Position below button by default
                let top = buttonRect.bottom + 8;

                // Align menu directly below the button (left edges aligned)
                let left = buttonRect.left;

                // If menu goes beyond right edge, align to right edge of button
                if (left + menuWidth > viewportWidth - 8) {
                    left = buttonRect.right - menuWidth;
                }

                // If still goes beyond left edge, align to viewport
                if (left < 8) {
                    left = 8;
                }

                // Check if menu goes below viewport
                if (top + menuHeight > viewportHeight - 8) {
                    // Position above the button instead
                    top = buttonRect.top - menuHeight - 8;
                }

                // Ensure menu doesn't go above viewport
                if (top < 8) {
                    top = 8;
                }
            }
        };

        if (isOpen) {
            // Initial position calculation with small delay to ensure DOM is ready
            setTimeout(updatePosition, 10);

            // Update position on scroll (with capture to catch scroll in any parent)
            const handleScroll = () => updatePosition();
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);

            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Don't close if clicking on the button itself or the menu
            if (
                buttonRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }

            // Close the dropdown
            setIsOpen(false);
        };

        // Add listener with a small delay to avoid closing immediately
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling to parent row
        setIsOpen(!isOpen);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling to parent row
        setIsOpen(false);
    };

    return (
        // Add onClick handler to prevent clicks on the container from bubbling
        <div onClick={(e) => e.stopPropagation()}>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Actions"
                type="button"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                >
                    <circle cx="8" cy="2" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="14" r="1.5" />
                </svg>
            </button>

            {isOpen && (
                <ul
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        right: '0'
                        // top: `${position.top}px`,
                        // left: `${position.left}px`,
                    }}
                    className="z-[9999] p-2 border shadow-xl menu bg-base-100 rounded-box w-52 border-base-300"
                    onClick={handleMenuClick}
                >
                    {children}
                </ul>
            )}
        </div>
    );
};

export default ActionDropdown;