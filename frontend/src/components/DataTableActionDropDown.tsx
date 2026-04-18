import React, { type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ActionDropdownProps {
    children: ReactNode;
    trigger?: ReactNode;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ children, trigger }) => {
    return (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {trigger || (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-muted"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    align="end" 
                    className="w-48 p-1 rounded-xl border-border/50 bg-background/95 backdrop-blur-md shadow-xl"
                >
                    <div className="flex flex-col gap-0.5">
                        {children}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default ActionDropdown;