import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export type CurveChannel = 'master' | 'red' | 'green' | 'blue';

interface CurvesMenuProps {
	activeChannel: CurveChannel;
	onChannelChange: (channel: CurveChannel) => void;
	onDone: () => void;
}

export const CurvesMenu = ({ activeChannel, onChannelChange, onDone }: CurvesMenuProps) => {
	return (
		<div className="flex flex-col w-full">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
				<span className="text-sm font-medium text-zinc-200">Curves</span>
				<button
					onClick={onDone}
					className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full transition-colors"
				>
					<Check size={16} />
				</button>
			</div>

			{/* Channel Selectors */}
			<div className="flex items-center justify-center gap-8 py-6">
				<ChannelRing
					color="white"
					isActive={activeChannel === 'master'}
					onClick={() => onChannelChange('master')}
				/>
				<ChannelRing
					color="red"
					isActive={activeChannel === 'red'}
					onClick={() => onChannelChange('red')}
				/>
				<ChannelRing
					color="green"
					isActive={activeChannel === 'green'}
					onClick={() => onChannelChange('green')}
				/>
				<ChannelRing
					color="blue"
					isActive={activeChannel === 'blue'}
					onClick={() => onChannelChange('blue')}
				/>
			</div>
		</div>
	);
};

const ChannelRing = ({
	color,
	isActive,
	onClick
}: {
	color: string;
	isActive: boolean;
	onClick: () => void;
}) => {
	const getColorClass = (c: string) => {
		switch (c) {
			case 'red': return 'bg-red-500 border-red-500';
			case 'green': return 'bg-green-500 border-green-500';
			case 'blue': return 'bg-blue-500 border-blue-500';
			default: return 'bg-white border-white';
		}
	};

	return (
		<button
			onClick={onClick}
			className="group relative flex items-center justify-center w-8 h-8 rounded-full focus:outline-none"
		>
			{/* Active Indicator Ring */}
			{isActive && (
				<motion.div
					layoutId="active-ring"
					className={`absolute inset-0 rounded-full border-2 ${getColorClass(color)} opacity-100`}
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1.25, opacity: 1 }}
					transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
				/>
			)}

			{/* Inner Dot */}
			<div className={`w-4 h-4 rounded-full ${getColorClass(color).split(' ')[0]} shadow-sm group-hover:scale-110 transition-transform duration-200`} />
		</button>
	);
};
