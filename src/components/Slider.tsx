import { useRef, useState } from 'react';

interface SliderProps {
	label: string;
	value: number;
	onChange: (value: number, isReset?: boolean) => void;
	min?: number;
	max?: number;
	step?: number;
	onInteractionStart?: () => void;
	onInteractionEnd?: () => void;
	hideLabel?: boolean;
	trackBackground?: string;
	defaultValue?: number;
}

export const Slider = ({
	label,
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	onInteractionStart,
	onInteractionEnd,
	hideLabel = false,
	trackBackground,
	defaultValue = 0,
}: SliderProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const startX = useRef(0);
	const startY = useRef(0);
	const startValue = useRef(0);
	const lastTapTime = useRef(0);
	const interactionStarted = useRef(false);
	const gestureDetected = useRef<'none' | 'slide' | 'scroll'>('none');

	const handlePointerDown = (e: React.PointerEvent) => {
		const now = Date.now();
		const timeSinceLastTap = now - lastTapTime.current;

		if (timeSinceLastTap < 300) {
			// Double tap detected
			onChange(defaultValue, true);
			lastTapTime.current = 0; // Prevent triple tap
			return;
		}

		lastTapTime.current = now;

		startX.current = e.clientX;
		startY.current = e.clientY;
		startValue.current = value;
		gestureDetected.current = 'none';
		interactionStarted.current = false;

		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			if (gestureDetected.current === 'scroll') return;

			const dx = e.clientX - startX.current;
			const dy = e.clientY - startY.current;
			const threshold = 5;

			// Recognize gesture if not yet determined
			if (gestureDetected.current === 'none') {
				const absDx = Math.abs(dx);
				const absDy = Math.abs(dy);

				if (absDx > threshold || absDy > threshold) {
					if (absDx > absDy) {
						// It's a slide
						gestureDetected.current = 'slide';
						setIsDragging(true); // Ring diameter changes only now
						onInteractionStart?.();
						interactionStarted.current = true;
					} else {
						// It's a scroll
						gestureDetected.current = 'scroll';
						e.currentTarget.releasePointerCapture(e.pointerId);
						return;
					}
				} else {
					return; // Not moved enough to decide
				}
			}

			if (gestureDetected.current === 'slide') {
				if (!containerRef.current) return;

				const rect = containerRef.current.getBoundingClientRect();
				const range = max - min;
				const deltaValue = (dx / rect.width) * range;

				let newValue = startValue.current + deltaValue;

				if (step > 0) {
					const steps = Math.round((newValue - min) / step);
					newValue = min + steps * step;
				}

				newValue = Math.max(min, Math.min(max, newValue));

				if (newValue !== value) {
					onChange(newValue);
				}
			}
		}
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (interactionStarted.current) {
			onInteractionEnd?.();
		}

		setIsDragging(false);
		interactionStarted.current = false;
		gestureDetected.current = 'none';
		e.currentTarget.releasePointerCapture(e.pointerId);
	};

	const percentage = ((value - min) / (max - min)) * 100;

	// Calculate active track parameters (fill from 0 if possible, else from min)
	const originValue = (min < 0 && max > 0) ? 0 : min;
	const originPercentage = ((originValue - min) / (max - min)) * 100;
	const activeLeft = Math.min(originPercentage, percentage);
	const activeWidth = Math.abs(percentage - originPercentage);

	return (
		<div
			className="w-[90%] mx-auto select-none relative"
			style={{
				visibility: isDragging ? 'visible' : undefined,
				background: isDragging ? 'transparent' : undefined,
				overscrollBehavior: 'none',
			}}
		>
			<div className={`flex justify-between mb-3 transition-opacity duration-200 ${hideLabel ? 'opacity-0' : 'opacity-100'}`}>
				<label className="text-xs font-bold text-zinc-400 uppercase">{label}</label>
				<span className="text-xs text-zinc-500 font-mono">{value.toFixed(0)}</span>
			</div>

			<div
				ref={containerRef}
				className={`relative w-full h-5 flex items-center cursor-pointer ${isDragging ? 'touch-none' : 'touch-pan-y'}`}
				style={{
					'--thumb-x': `${percentage}%`,
					overscrollBehavior: 'none',
				} as React.CSSProperties}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
			>
				{/* Track Background with Mask */}
				<div
					className="absolute border border-zinc-800 top-1/2 -translate-y-1/2 w-full h-[3px] rounded-full pointer-events-none"
					style={{
						background: trackBackground || '#3f3f46', // zinc-700 hex
						maskImage: `radial-gradient(circle at var(--thumb-x) 50%, transparent 13px, black 14px)`,
						WebkitMaskImage: `radial-gradient(circle at var(--thumb-x) 50%, transparent 13px, black 14px)`
					}}
				/>

				{/* Active Track Fill with Mask */}
				<div
					className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-white rounded-full pointer-events-none left-0"
					style={{
						clipPath: `inset(0 ${100 - (activeLeft + activeWidth)}% 0 ${activeLeft}%)`,
						maskImage: `radial-gradient(circle at var(--thumb-x) 50%, transparent 13px, black 14px)`,
						WebkitMaskImage: `radial-gradient(circle at var(--thumb-x) 50%, transparent 13px, black 14px)`
					}}
				/>

				{/* Interactive Thumb Wrapper */}
				<div
					className="absolute top-1/2 w-8 h-8 z-20 flex items-center justify-center pointer-events-none outline-none"
					style={{
						left: `${percentage}%`,
						transform: 'translate(-50%, -50%)'
					}}
				>
					{/* Visual Ring */}
					<div
						className="w-5 h-5 border-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] pointer-events-none transition-[border-width] duration-200 ease-out"
						style={{
							backgroundColor: 'transparent',
							borderWidth: isDragging ? '8px' : '2.0px'
						}}
					/>
				</div>
			</div>
		</div>
	);
};
