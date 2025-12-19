import { type LucideIcon } from 'lucide-react';

export interface MenuItem {
	id: string;
	icon: LucideIcon;
	label: string;
}

interface FloatingMenuProps {
	items: MenuItem[];
	activeId: string | null;
	onItemChange: (id: string | null) => void;
	className?: string;
}

export const FloatingMenu = ({ items, activeId, onItemChange, className = '' }: FloatingMenuProps) => {
	return (
		<div
			className={`
				w-full z-20 flex justify-around p-4
				bg-transparent
				${className}
			`}
		>
			{items.map((item) => (
				<button
					key={item.id}
					onClick={() => onItemChange(activeId === item.id ? null : item.id)}
					className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors duration-200 cursor-pointer ${activeId === item.id
						? 'text-blue-500'
						: 'text-zinc-400 hover:text-white'
						}`}
				>
					<div className={`p-2 rounded-full ${activeId === item.id ? 'bg-blue-500/10' : ''}`}>
						<item.icon size={20} />
					</div>
					<span className="text-[10px] font-medium">{item.label}</span>
				</button>
			))}
		</div>
	);
};
