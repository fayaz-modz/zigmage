import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useMotionValue, animate, motion } from 'framer-motion';
import { ZigmageEngine } from '../lib/ZigmageEngine';
import { useCanvasGestures } from '../hooks/useCanvasGestures';

export interface CanvasProps {
	exposure: number;
	contrast: number;
	highlights: number;
	shadows: number;
	blacks: number;
	temperature: number;
	tint: number;
	vibrance: number;
	saturation: number;

	isComparing: boolean;
	onToggleUI?: () => void;
	onCompareStart?: () => void;
	onCompareEnd?: () => void;
	onInteractionStart?: () => void;
	menuOffset?: boolean;
}

export interface CanvasRef {
	setImage: (bitmap: ImageBitmap) => void;
	resetTransform: () => void;
	setLoading: (loading: boolean) => void;
	setCurves: (lut: Uint8Array) => void;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({
	exposure,
	contrast,
	highlights,
	shadows,
	blacks,
	temperature,
	tint,
	vibrance,
	saturation,

	isComparing,
	onToggleUI,
	onCompareStart,
	onCompareEnd,
	onInteractionStart,
	menuOffset = false
}, ref) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const engineRef = useRef<ZigmageEngine | null>(null);

	const yOffset = useMotionValue(0);
	const transformRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
	const [isMobile, setIsMobile] = useState(false);

	const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
	const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
	const [isLoading, setIsLoading] = useState(false);

	const { transform, setTransform, handlers } = useCanvasGestures({
		canvasRef,
		canvasSize,
		imageSize,
		onToggleUI,
		onCompareStart,
		onCompareEnd,
		onInteractionStart
	});

	// Detect screen size
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768); // md breakpoint
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Keep ref in sync for animation callback
	useEffect(() => {
		transformRef.current = transform;
	}, [transform]);

	// Animate Y-offset - Only on mobile
	useEffect(() => {
		// Target offset when menu is open: 0.15 (move image up) - only on mobile
		const targetOffset = menuOffset && isMobile ? 0.15 : 0;
		const controls = animate(yOffset, targetOffset, {
			duration: 0.3,
			ease: [0.32, 0.72, 0, 1]
		});
		return () => controls.stop();
	}, [menuOffset, yOffset, isMobile]);

	// Listen to Y-offset Changes
	useEffect(() => {
		const unsubscribe = yOffset.on("change", (latestOffset) => {
			if (engineRef.current && imageSize.width > 0 && imageSize.height > 0) {
				const currentTransform = transformRef.current;
				engineRef.current.updateTransform(
					currentTransform.zoom,
					currentTransform.zoom,
					currentTransform.pan.x,
					currentTransform.pan.y + latestOffset
				);
			}
		});
		return () => unsubscribe();
	}, [yOffset, imageSize]);

	// Initialize Engine
	useEffect(() => {
		if (!engineRef.current) {
			engineRef.current = new ZigmageEngine();
		}
		if (canvasRef.current) {
			engineRef.current.init(canvasRef.current);
		}
		return () => {
			engineRef.current?.destroy();
		};
	}, []);

	// Handle Size Changes
	useEffect(() => {
		const container = canvasRef.current?.parentElement;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				const dpr = window.devicePixelRatio || 1;
				setCanvasSize({ width: width * dpr, height: height * dpr });
			}
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	// Handle Image Loading via Ref
	useImperativeHandle(ref, () => ({
		setImage: async (bitmap: ImageBitmap) => {
			setIsLoading(true);
			const { width, height } = bitmap;
			const engine = engineRef.current;
			if (!engine) {
				setIsLoading(false);
				return;
			}

			// Check Max Texture Size
			const maxTextureSize = engine.getMaxTextureSize();
			if (maxTextureSize > 0 && (width > maxTextureSize || height > maxTextureSize)) {
				alert(`Image is too large. Max texture size is ${maxTextureSize}x${maxTextureSize}`);
				setIsLoading(false);
				return;
			}

			setImageSize({ width, height });
			setTransform({ zoom: 1, pan: { x: 0, y: 0 } });

			// Clear previous layers
			engine.resetLayers();

			// Create canvas to extract data
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.drawImage(bitmap, 0, 0);
				const imageData = ctx.getImageData(0, 0, width, height);
				engine.loadImage(width, height, imageData.data);
			}

			// Small delay to ensure rendering completes
			setTimeout(() => setIsLoading(false), 100);
		},
		resetTransform: () => {
			setTransform({ zoom: 1, pan: { x: 0, y: 0 } });
		},
		setLoading: (loading: boolean) => {
			setIsLoading(loading);
		},
		setCurves: (lut: Uint8Array) => {
			engineRef.current?.setCurves(lut);
		}
	}));

	// Update Params
	useEffect(() => {
		const engine = engineRef.current;
		if (!engine) return;

		if (isComparing) {
			engine.updateFullParams({
				exposure: 0,
				contrast: 0,
				highlights: 0,
				shadows: 0,
				blacks: 0,
				temperature: 0,
				tint: 0,
				vibrance: 0,
				saturation: 0
			});
		} else {
			engine.updateFullParams({
				exposure,
				contrast,
				highlights,
				shadows,
				blacks,
				temperature,
				tint,
				vibrance,
				saturation
			});
		}
	}, [exposure, contrast, highlights, shadows, blacks, temperature, tint, vibrance, saturation, isComparing]);

	// Update Transform & Viewport
	useEffect(() => {
		const engine = engineRef.current;
		if (!engine) return;

		if (canvasSize.width > 0 && canvasSize.height > 0) {
			engine.updateViewport(canvasSize.width, canvasSize.height);

			if (imageSize.width > 0 && imageSize.height > 0) {
				// Pass raw zoom. Zig handles aspect ratio fitting.
				// Include current animated offset
				engine.updateTransform(transform.zoom, transform.zoom, transform.pan.x, transform.pan.y + yOffset.get());
			}
		}
	}, [transform, canvasSize, imageSize]);

	return (
		<div className="w-full h-full bg-black overflow-hidden flex items-center justify-center relative">
			<canvas
				ref={canvasRef}
				width={canvasSize.width}
				height={canvasSize.height}
				className="max-w-none cursor-move"
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'contain'
				}}
				{...handlers}
			/>

			{/* Loading Overlay */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: isLoading ? 1 : 0 }}
				transition={{ duration: 0.2 }}
				className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none"
				style={{ display: isLoading ? 'flex' : 'none' }}
			>
				<div className="flex flex-col items-center gap-4">
					{/* Spinning Circle */}
					<motion.div
						animate={{ rotate: 360 }}
						transition={{
							duration: 1,
							repeat: Infinity,
							ease: "linear"
						}}
						className="w-12 h-12 border-4 border-zinc-700 border-t-blue-500 rounded-full"
					/>
					<p className="text-sm text-zinc-400 font-medium">Loading image...</p>
				</div>
			</motion.div>
		</div>
	);
});

Canvas.displayName = 'Canvas';
