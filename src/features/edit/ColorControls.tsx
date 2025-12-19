import { useState } from 'react';
import { Slider } from '../../components/Slider';
import { useStatusPill } from '../../stores/statusStore';

interface ColorControlsProps {
	temperature: number;
	setTemperature: (val: number) => void;
	tint: number;
	setTint: (val: number) => void;
	vibrance: number;
	setVibrance: (val: number) => void;
	saturation: number;
	setSaturation: (val: number) => void;

	onInteractionStart?: () => void;
	onInteractionEnd?: () => void;
	isInteracting?: boolean;
}

export const ColorControls = ({
	temperature, setTemperature,
	tint, setTint,
	vibrance, setVibrance,
	saturation, setSaturation,
	onInteractionStart,
	onInteractionEnd,
	isInteracting
}: ColorControlsProps) => {
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

	return (
		<div className="space-y-6">
			{/* Temperature */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'temperature' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Temp"
					value={temperature}
					onChange={(v, isReset) => handleChange(setTemperature, 'Temp', v, formatInt, isReset)}
					min={-100}
					max={100}
					step={1}
					onInteractionStart={() => handleStart('temperature', 'Temp', temperature, formatInt)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
					trackBackground="linear-gradient(to right, #5a8bd8, #d8a85a)"
				/>
			</div>

			{/* Tint */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'tint' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Tint"
					value={tint}
					onChange={(v, isReset) => handleChange(setTint, 'Tint', v, formatInt, isReset)}
					min={-100}
					max={100}
					step={1}
					onInteractionStart={() => handleStart('tint', 'Tint', tint, formatInt)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
					trackBackground="linear-gradient(to right, #5ad891, #d85ab7)"
				/>
			</div>

			{/* Vibrance */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'vibrance' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Vibrance"
					value={vibrance}
					onChange={(v, isReset) => handleChange(setVibrance, 'Vibrance', v, formatInt, isReset)}
					min={-100}
					max={100}
					step={1}
					onInteractionStart={() => handleStart('vibrance', 'Vibrance', vibrance, formatInt)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
					trackBackground="linear-gradient(to right, #71717a, #5a8bd8)"
				/>
			</div>

			{/* Saturation */}
			<div className={`transition-opacity duration-200 ${isInteracting && activeId !== 'saturation' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<Slider
					label="Saturation"
					value={saturation}
					onChange={(v, isReset) => handleChange(setSaturation, 'Saturation', v, formatInt, isReset)}
					min={-100}
					max={100}
					step={1}
					onInteractionStart={() => handleStart('saturation', 'Saturation', saturation, formatInt)}
					onInteractionEnd={handleEnd}
					hideLabel={isInteracting}
					trackBackground="linear-gradient(to right, #71717a, #d85a6a)"
				/>
			</div>
		</div>
	);
};
