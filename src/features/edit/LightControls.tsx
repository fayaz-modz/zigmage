import { useState } from 'react';
import { Slider } from '../../components/Slider';
import { useStatusPill } from '../../stores/statusStore';

interface LightControlsProps {
	exposure: number;
	setExposure: (val: number) => void;
	contrast: number;
	setContrast: (val: number) => void;
	highlights: number;
	setHighlights: (val: number) => void;
	shadows: number;
	setShadows: (val: number) => void;
	blacks: number;
	setBlacks: (val: number) => void;

	onInteractionStart?: () => void;
	onInteractionEnd?: () => void;
	isInteracting?: boolean;
	onOpenCurves?: () => void;
}


export const LightControls = ({
	exposure, setExposure,
	contrast, setContrast,
	highlights, setHighlights,
	shadows, setShadows,
	blacks, setBlacks,
	onInteractionStart,
	onInteractionEnd,
	isInteracting,
	onOpenCurves // Add prop
}: LightControlsProps) => {
	const [activeId, setActiveId] = useState<string | null>(null);
	const { showStatus, hideStatus } = useStatusPill();

	const handleStart = (id: string, label: string, val: number, format: (v: number) => string) => {
		setActiveId(id);
		showStatus(label, format(val));
		onInteractionStart?.();
	};

	const handleChange = (setter: (v: number) => void, label: string, val: number, format: (v: number) => string, isReset?: boolean) => {
		setter(val);
		if (!isReset) {
			showStatus(label, format(val));
		}
	};

	const handleEnd = () => {
		setActiveId(null);
		hideStatus();
		onInteractionEnd?.();
	};

	const formatInt = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(0)}`;
	const formatFloat = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}`;

	return (
		<div className="space-y-6 flex flex-col">
			{/* Curves Entry */}
			<button
				onClick={onOpenCurves}
				className="flex gap-2 items-center justify-between self-end mx-4 p-2 bg-zinc-950/60 rounded border border-zinc-700"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
					<path d="M4 20 C 4 20, 10 20, 12 12 C 14 4, 20 4, 20 4" />
				</svg>
				Curves
			</button>

			{/* Exposure */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'exposure' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Exposure"
					value={exposure}
					onChange={(v, isReset) => handleChange(setExposure, 'Exposure', v, formatFloat, isReset)}
					min={-5}
					max={5}
					step={0.01}
					onInteractionStart={() => handleStart('exposure', 'Exposure', exposure, formatFloat)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
				/>
			</div>

			{/* Contrast */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'contrast' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Contrast"
					value={contrast}
					onChange={(v, isReset) => handleChange(setContrast, 'Contrast', v, formatInt, isReset)}
					min={-100}
					max={100}
					step={1}
					onInteractionStart={() => handleStart('contrast', 'Contrast', contrast, formatInt)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
				/>
			</div>

			{/* Highlights */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'highlights' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Highlights"
					value={highlights}
					onChange={(v, isReset) => handleChange(setHighlights, 'Highlights', v, formatInt, isReset)}
					min={-100}
					max={100}
					step={1}
					onInteractionStart={() => handleStart('highlights', 'Highlights', highlights, formatInt)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
				/>
			</div>

			{/* Shadows */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'shadows' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Shadows"
					value={shadows}
					onChange={(v, isReset) => handleChange(setShadows, 'Shadows', v, formatInt, isReset)}
					min={-100}
					max={100}
					step={1}
					onInteractionStart={() => handleStart('shadows', 'Shadows', shadows, formatInt)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
				/>
			</div>

			{/* Blacks */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'blacks' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Blacks"
					value={blacks}
					onChange={(v, isReset) => handleChange(setBlacks, 'Blacks', v, formatInt, isReset)}
					min={-100}
					max={100}
					step={1}
					onInteractionStart={() => handleStart('blacks', 'Blacks', blacks, formatInt)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
				/>
			</div>
		</div>
	);
};
