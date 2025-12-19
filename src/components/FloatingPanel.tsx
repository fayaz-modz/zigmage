import { type LucideIcon } from 'lucide-react';

export interface TabItem {
	id: string;
	icon: LucideIcon;
	label: string;
}

interface FloatingPanelProps {
	children: React.ReactNode;
	tabs?: TabItem[];
	activeTab?: string | null;
	onTabChange?: (id: string | null) => void;
	className?: string;
}

export const FloatingPanel = ({
	children,
	tabs,
	activeTab,
	onTabChange,
	className = '',
}: FloatingPanelProps) => {

	const hasActiveTab = !!activeTab;

	const renderTabs = () => {
		if (!tabs || tabs.length === 0) return null;

		return (
			<div className="flex justify-between items-center p-2">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => onTabChange?.(activeTab === tab.id ? '' : tab.id)}
						className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors duration-200 min-w-[60px] cursor-pointer ${activeTab === tab.id
							? 'text-blue-500 bg-zinc-800'
							: 'text-zinc-400 hover:text-white'
							}`}
					>
						<div className="py-1">
							<tab.icon size={18} />
						</div>
						<span className="text-[10px] font-medium">{tab.label}</span>
					</button>
				))}
			</div>
		);
	};

	return (
		<div className={`w-full flex flex-col-reverse ${className}`}>
			{/* Tabs - Front Layer (z-20) - Visible when tabs exist */}
			{tabs && tabs.length > 0 && (
				<>
					<div className="w-full relative z-20">
						{renderTabs()}
					</div>
					{/* Separator between tabs and content */}
					{hasActiveTab && <hr className="w-full border-0 border-t border-zinc-800/50 m-0" />}
				</>
			)}

			{/* Content - Back Layer (z-10) - Emerges from behind tabs */}
			{/* Uses grid animation for smooth height transition */}
			<div
				className="w-full relative z-10 overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
				style={{
					display: 'grid',
					gridTemplateRows: hasActiveTab ? '1fr' : '0fr',
				}}
			>
				<div className="min-h-0 overflow-hidden">
					<div
						className="h-[25dvh] overflow-auto custom-scrollbar w-full px-2 py-4"
						style={{ overscrollBehavior: 'contain' }}
					>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
