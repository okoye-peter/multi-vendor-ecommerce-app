import React, { type ReactNode, useRef, useState, useEffect } from 'react';

// TypeScript interface for ActionDropdown props
interface ActionDropdownProps {
    children: ReactNode;
}

// Reusable Dropdown Actions Component with Fixed Positioning
const ActionDropdown: React.FC<ActionDropdownProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (isOpen && buttonRef.current && menuRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const menuHeight = menuRef.current.offsetHeight;
            const menuWidth = 208; // 52 * 4 (w-52 in Tailwind)
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Default: position below button, aligned to right
            let top = buttonRect.bottom + 8; // 8px gap
            let left = buttonRect.right - menuWidth;

            // Check if menu goes below viewport
            if (buttonRect.bottom + menuHeight + 8 > viewportHeight) {
                // Position above the button
                top = buttonRect.top - menuHeight - 8;
            }

            // Check if menu goes beyond right edge
            if (left + menuWidth > viewportWidth) {
                left = viewportWidth - menuWidth - 16;
            }

            // Check if menu goes beyond left edge
            if (left < 16) {
                left = 16;
            }

            setPosition({ top, left });
        }
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Actions"
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
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-[9998]" 
                        onClick={handleClose}
                    />
                    
                    {/* Menu with fixed positioning (relative to viewport) */}
                    <ul
                        ref={menuRef}
                        style={{
                            position: 'fixed',
                            top: `${position.top}px`,
                            left: `${position.left}px`,
                        }}
                        className="z-[9999] p-2 border shadow-xl menu bg-base-100 rounded-box w-52 border-base-300"
                        onClick={handleClose}
                    >
                        {children}
                    </ul>
                </>
            )}
        </>
    );
};

export default ActionDropdown;