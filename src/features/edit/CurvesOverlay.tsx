import { useRef, useState, useMemo } from 'react';
import { type CurveChannel } from './CurvesMenu';
import { MonotonicSpline } from '../../lib/spline';

interface Point {
	x: number;
	y: number;
}

interface CurvesOverlayProps {
	activeChannel: CurveChannel;
	points: Point[];
	visible: boolean;
	onChange: (points: Point[]) => void;
}

export const CurvesOverlay = ({ activeChannel, points, visible, onChange }: CurvesOverlayProps) => {
	const svgRef = useRef<SVGSVGElement>(null);
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const lastClickTime = useRef<number>(0);
	const lastClickIndex = useRef<number | null>(null);

	const PADDING = 40;

	// Dimensions logic
	const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

	useMemo(() => {
		const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const { width, height } = dimensions;
	const size = Math.min(width - PADDING * 2, height - PADDING * 2, 500);
	const gridX = (width - size) / 2;
	const gridY = (height - size) / 2;

	const toNormalized = (clientX: number, clientY: number) => {
		if (!svgRef.current) return null;
		const rect = svgRef.current.getBoundingClientRect();
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		return {
			x: Math.max(0, Math.min(1, (x - gridX) / size)),
			y: Math.max(0, Math.min(1, (gridY + size - y) / size))
		};
	};

	// Generate curve path
	const pathData = useMemo(() => {
		if (points.length < 2) return '';
		const spline = new MonotonicSpline(points);
		const steps = 100;
		let path = '';
		for (let i = 0; i <= steps; i++) {
			const xNorm = i / steps;
			const yNorm = spline.interpolate(xNorm);
			const x = gridX + xNorm * size;
			const y = gridY + size - (yNorm * size);
			path += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
		}
		return path;
	}, [points, size, gridX, gridY]);

	const handlePointerDown = (e: React.PointerEvent, index?: number) => {
		if (!visible) return;
		e.stopPropagation();

		const pos = toNormalized(e.clientX, e.clientY);
		if (!pos) return;

		const now = Date.now();

		if (index !== undefined) {
			// Double click to delete
			if (now - lastClickTime.current < 300 && lastClickIndex.current === index) {
				if (index !== 0 && index !== points.length - 1) {
					onChange(points.filter((_, i) => i !== index));
					setDraggingIndex(null);
					return;
				}
			}
			lastClickTime.current = now;
			lastClickIndex.current = index;
			setDraggingIndex(index);
			(e.currentTarget as Element).setPointerCapture(e.pointerId);
		} else {
			// Add new point by clicking ON THE LINE
			const newPoint = { x: pos.x, y: pos.y };
			const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);
			const newIndex = newPoints.findIndex(p => p.x === newPoint.x && p.y === newPoint.y);
			onChange(newPoints);
			setDraggingIndex(newIndex);
			lastClickTime.current = now;
			lastClickIndex.current = newIndex;
			(e.currentTarget as Element).setPointerCapture(e.pointerId);
		}
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (draggingIndex === null || !visible) return;

		const pos = toNormalized(e.clientX, e.clientY);
		if (!pos) return;

		const newPoints = [...points];
		const p = { ...newPoints[draggingIndex] };
		p.y = Math.max(0, Math.min(1, pos.y));

		if (draggingIndex === 0) {
			p.x = 0;
		} else if (draggingIndex === points.length - 1) {
			p.x = 1;
		} else {
			p.x = Math.max(0, Math.min(1, pos.x));
			const prev = newPoints[draggingIndex - 1];
			const next = newPoints[draggingIndex + 1];
			if (prev) p.x = Math.max(prev.x + 0.01, p.x);
			if (next) p.x = Math.min(next.x - 0.01, p.x);
		}

		newPoints[draggingIndex] = p;
		onChange(newPoints);
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (draggingIndex !== null) {
			e.stopPropagation();
		}
		setDraggingIndex(null);
	};

	const stopAll = (e: React.SyntheticEvent) => e.stopPropagation();

	if (!visible) return null;

	const strokeColor = {
		master: 'white',
		red: '#ef4444',
		green: '#22c55e',
		blue: '#3b82f6'
	}[activeChannel];

	return (
		<svg
			ref={svgRef}
			className="fixed inset-0 z-40 w-full h-full pointer-events-none touch-none"
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerUp}
		>
			{/* Grid Area (Fully Transparent for passthrough) */}
			{/* <rect x={gridX} y={gridY} width={size} height={size} fill="transparent" /> */}

			{/* Grid Lines */}
			{[0.25, 0.5, 0.75].map(pos => (
				<g key={pos} stroke="rgba(255,255,255,0.3)" strokeWidth="1">
					<line x1={gridX + pos * size} y1={gridY} x2={gridX + pos * size} y2={gridY + size} />
					<line x1={gridX} y1={gridY + pos * size} x2={gridX + size} y2={gridY + pos * size} />
				</g>
			))}

			{/* Border */}
			<rect x={gridX} y={gridY} width={size} height={size} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

			{/* Diagonal Reference */}
			<line x1={gridX} y1={gridY + size} x2={gridX + size} y2={gridY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

			{/* Curve Line - Interaction enabled via pointer-events: stroke */}
			{/* Hit Area (Invisible but thick) */}
			<path
				d={pathData}
				fill="none"
				stroke="transparent"
				strokeWidth="24"
				style={{ opacity: 0, pointerEvents: 'stroke', cursor: 'crosshair' }}
				onPointerDown={(e) => handlePointerDown(e)}
				onPointerUp={stopAll}
				onClick={stopAll}
				onDoubleClick={stopAll}
			/>
			{/* Visible Curve */}
			<path
				d={pathData}
				fill="none"
				stroke="black"
				strokeWidth="4"
				style={{ pointerEvents: 'none' }}
			/>
			<path
				d={pathData}
				fill="none"
				stroke={strokeColor}
				strokeWidth="2"
				style={{ pointerEvents: 'stroke', cursor: 'crosshair' }}
				onPointerDown={(e) => handlePointerDown(e)}
				onPointerUp={stopAll}
				onClick={stopAll}
				onDoubleClick={stopAll}
			/>

			{/* Points - Interaction enabled via pointer-events: auto */}
			{points.map((p, i) => {
				const x = gridX + p.x * size;
				const y = gridY + size - (p.y * size);
				const isDragging = draggingIndex === i;

				return (
					<g
						key={i}
						style={{ pointerEvents: 'auto', cursor: 'grab' }}
						onPointerDown={(e) => handlePointerDown(e, i)}
						onPointerUp={stopAll}
						onClick={stopAll}
						onDoubleClick={stopAll}
					>
						{/* Larger Hit Area */}
						<circle
							cx={x}
							cy={y}
							r={isDragging ? 16 : 12}
							fill="white"
							fillOpacity={isDragging ? 0.3 : 0.15}
						/>
						{/* Visible Dot */}
						<circle
							cx={x}
							cy={y}
							r="4"
							fill="white"
							stroke="rgba(0,0,0,0.5)"
							strokeWidth="1"
						/>
					</g>
				);
			})}
		</svg>
	);
};
