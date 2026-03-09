import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageWrapper({ children, title, subtitle, actions }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased h-full overflow-hidden flex flex-col lg:flex-row">
            {/* Sidebar (Desktop + Mobile Drawer) */}
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-[260px] h-screen bg-[#F8FAFC]">
                {/* Navbar (Search + Notifications + User Avatar) */}
                <Navbar setMobileOpen={setMobileOpen} />

                {/* Page Content Scroll Container */}
                <main className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        {/* Optional Page Header */}
                        {(title || subtitle || actions) && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    {title && (
                                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                                            {title}
                                        </h1>
                                    )}
                                    {subtitle && (
                                        <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                {actions && (
                                    <div className="flex items-center gap-3 mt-4 sm:mt-0">
                                        {actions}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actual Page Components */}
                        <div className="animate-slide-up pb-12">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
