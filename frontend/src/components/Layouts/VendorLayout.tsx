import { useState } from 'react';
import VendorSidebar from '../VendorSidebar';
import type { VendorLayoutProps } from '../../types/Index';

const VendorLayout = ({ children }: VendorLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    return (
        <div className="flex h-screen bg-base-200" data-theme="corporate">
            <VendorSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default VendorLayout