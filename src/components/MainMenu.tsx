import { MENU_ITEMS } from '../features/exports';
import { useState, useEffect, useRef } from 'react';

interface MainMenuProps {
    activeMode: string | null;
    onModeChange: (mode: string | null) => void;
    children?: React.ReactNode;
    isInteracting?: boolean;
    contentKey?: string;
    isExpanded?: boolean;
}

export const MainMenu = ({ activeMode, onModeChange, children, isInteracting = false, contentKey, isExpanded }: MainMenuProps) => {
    const menuItems = MENU_ITEMS;
    const hasActiveMode = !!isExpanded;

    const [previousContent, setPreviousContent] = useState<React.ReactNode>(null);
    const [previousKey, setPreviousKey] = useState<string>('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (contentKey !== previousKey && previousKey) {
            // Start transition
            setIsTransitioning(true);
            setPreviousContent(children);

            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Clean up after transition completes
            timeoutRef.current = setTimeout(() => {
                setIsTransitioning(false);
                setPreviousContent(null);
            }, 300); // Match transition duration
        }

        setPreviousKey(contentKey || '');

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [contentKey]);

    return (
        <div
            className={`
                fixed flex flex-col-reverse items-center
                left-1/2 -translate-x-1/2 
                transition-[bottom,width,max-width,border-radius,border-width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                md:left-auto md:translate-x-0 md:right-4 md:bottom-6 md:w-96
                bg-zinc-900/95 ${!isInteracting && 'backdrop-blur-md'} border-zinc-700 shadow-2xl overflow-hidden
                ${hasActiveMode
                    ? 'bottom-0 w-full rounded-none md:rounded-xl border-t border-x-0 border-b-0 md:border'
                    : 'bottom-[calc(1rem+env(safe-area-inset-bottom))] w-[calc(100%-2rem)] max-w-[90vw] rounded-xl md:m-0 md:w-auto md:min-w-96 border'
                }
            `}
            style={{
                visibility: isInteracting ? 'hidden' : undefined,
                zIndex: 100,
                isolation: 'isolate'
            }}
        >
            {/* Navigation Items - Front Card (z-20) - Always visible */}
            <div
                style={{ paddingBottom: hasActiveMode ? "env(safe-area-inset-bottom)" : "0px" }}
                className={`
                    w-full relative z-20 flex justify-center items-center 
                    transition-[padding-bottom] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                `}
            >
                <div className="grid grid-cols-5 items-center w-full max-w-[90vw] md:max-w-[384px]">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onModeChange(activeMode === item.id ? null : item.id)}
                            className={`
                                flex flex-col cursor-pointer items-center justify-center py-2 
                                transition-colors duration-200
                                ${activeMode === item.id ? 'text-blue-500' : 'text-zinc-400'}
                            `}
                        >
                            <div className={`
                                relative z-10 p-2 transition duration-100 rounded-sm
                                ${activeMode === item.id ? 'bg-blue-500 text-white' : ''}
                            `}>
                                <item.icon size={24} strokeWidth={1.6} />
                            </div>
                            <div
                                className={`
                                    grid text-[9px] font-medium
                                    transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                                    ${hasActiveMode
                                        ? 'grid-rows-[0fr] opacity-0 mt-0'
                                        : 'grid-rows-[1fr] opacity-100 mt-1'
                                    }
                                `}
                            >
                                <div className="overflow-hidden">
                                    {item.label}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Separator - only visible when panel is open */}
            {hasActiveMode && <hr className="w-full border-0 border-t border-zinc-800/50 m-0" />}

            {/* Panel Content Area - Back Card (z-10) - Slides out from behind using grid animation */}
            <div
                className={`
                    w-full relative z-10 overflow-hidden
                    transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                `}
                style={{
                    display: 'grid',
                    gridTemplateRows: hasActiveMode ? '1fr' : '0fr',
                    opacity: hasActiveMode ? 1 : 0,
                }}
            >
                <div className="min-h-0 overflow-hidden relative">
                    {/* Previous content - fading out */}
                    {isTransitioning && previousContent && (
                        <div
                            className="absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                            style={{ opacity: 0 }}
                        >
                            {previousContent}
                        </div>
                    )}

                    {/* Current content - fading in */}
                    <div
                        className="transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        style={{ opacity: isTransitioning ? 0 : 1 }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
