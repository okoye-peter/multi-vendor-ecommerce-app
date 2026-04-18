import { useState } from 'react';
import VendorSidebar from '../VendorSidebar';
import type { VendorLayoutProps } from '@/types/Index';

const VendorLayout = ({ children }: VendorLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/10 selection:text-primary">
            <VendorSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
                {/* Header spacer or actual vendor header could go here */}
                <main className="flex-1 overflow-y-auto p-8 lg:p-12 animate-fade-in">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default VendorLayout;