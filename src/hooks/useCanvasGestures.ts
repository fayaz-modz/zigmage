import { useState, useRef, type RefObject } from 'react';

interface Transform {
	zoom: number;
	pan: { x: number; y: number };
}

interface CanvasGesturesProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	canvasSize: { width: number; height: number };
	imageSize: { width: number; height: number };
	onToggleUI?: () => void;
	onCompareStart?: () => void;
	onCompareEnd?: () => void;
	onInteractionStart?: () => void;
}

export const useCanvasGestures = ({
	canvasRef,
	canvasSize,
	imageSize,
	onToggleUI,
	onCompareStart,
	onCompareEnd,
	onInteractionStart
}: CanvasGesturesProps) => {
	const [transform, setTransform] = useState<Transform>({ zoom: 1, pan: { x: 0, y: 0 } });

	const isDragging = useRef(false);
	const lastMousePos = useRef({ x: 0, y: 0 });

	// Interaction refs
	const isTapRef = useRef(false);
	const didLongPress = useRef(false);
	const longPressTimer = useRef<number | null>(null);
	const startPos = useRef({ x: 0, y: 0 });
	const lastTouchTime = useRef(0);

	const { minZoom, maxZoom } = (() => {
		if (canvasSize.width === 0 || canvasSize.height === 0 || imageSize.width === 0 || imageSize.height === 0) {
			return { minZoom: 0.1, maxZoom: 50 };
		}
		const fitScale = Math.min(
			canvasSize.width / imageSize.width,
			canvasSize.height / imageSize.height
		);
		// Allow zooming in to 30x actual pixel size
		const max = Math.max(1, 40 / fitScale);
		return { minZoom: 0.1, maxZoom: max };
	})();

	const clampPan = (pan: { x: number, y: number }, zoom: number) => {
		if (canvasSize.width === 0 || canvasSize.height === 0 || imageSize.width === 0 || imageSize.height === 0) return pan;

		const canvasAspect = canvasSize.width / canvasSize.height;
		const imageAspect = imageSize.width / imageSize.height;

		let scaleX = 1.0;
		let scaleY = 1.0;

		if (canvasAspect > imageAspect) {
			scaleX = imageAspect / canvasAspect;
			scaleY = 1.0;
		} else {
			scaleX = 1.0;
			scaleY = canvasAspect / imageAspect;
		}

		const effScaleX = scaleX * zoom;
		const effScaleY = scaleY * zoom;

		const margin = 0.1;
		const minX = -1 - effScaleX + margin;
		const maxX = 1 + effScaleX - margin;
		const minY = -1 - effScaleY + margin;
		const maxY = 1 + effScaleY - margin;

		return {
			x: Math.max(minX, Math.min(maxX, pan.x)),
			y: Math.max(minY, Math.min(maxY, pan.y))
		};
	};

	const handleWheel = (e: React.WheelEvent) => {
		e.preventDefault();
		const rect = canvasRef.current?.getBoundingClientRect();
		if (!rect) return;

		const x = (e.clientX - rect.left) / rect.width * 2 - 1;
		const y = -((e.clientY - rect.top) / rect.height * 2 - 1);

		const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(minZoom, Math.min(maxZoom, transform.zoom * scaleFactor));

		const scale = newZoom / transform.zoom;
		const newPanX = transform.pan.x * scale + x * (1 - scale);
		const newPanY = transform.pan.y * scale + y * (1 - scale);

		const clampedPan = clampPan({ x: newPanX, y: newPanY }, newZoom);
		setTransform({ zoom: newZoom, pan: clampedPan });
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (Date.now() - lastTouchTime.current < 1000) return;

		isDragging.current = true;
		lastMousePos.current = { x: e.clientX, y: e.clientY };
		startPos.current = { x: e.clientX, y: e.clientY };
		isTapRef.current = true;
		didLongPress.current = false;

		longPressTimer.current = window.setTimeout(() => {
			if (isTapRef.current && onCompareStart) {
				onCompareStart();
				didLongPress.current = true;
				isDragging.current = false;
			}
		}, 500);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (Date.now() - lastTouchTime.current < 1000) return;

		if (isTapRef.current) {
			const dx = e.clientX - startPos.current.x;
			const dy = e.clientY - startPos.current.y;
			if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
				isTapRef.current = false;
				if (longPressTimer.current) {
					clearTimeout(longPressTimer.current);
					longPressTimer.current = null;
				}
			}
		}

		if (!isDragging.current) return;
		const dx = e.clientX - lastMousePos.current.x;
		const dy = e.clientY - lastMousePos.current.y;
		lastMousePos.current = { x: e.clientX, y: e.clientY };

		const rect = canvasRef.current?.getBoundingClientRect();
		if (!rect) return;

		const ndcDx = dx / rect.width * 2;
		const ndcDy = -(dy / rect.height * 2);

		setTransform(prev => {
			const newPan = { x: prev.pan.x + ndcDx, y: prev.pan.y + ndcDy };
			const clampedPan = clampPan(newPan, prev.zoom);
			return { ...prev, pan: clampedPan };
		});
	};

	const handleMouseUp = () => {
		if (Date.now() - lastTouchTime.current < 1000) return;

		isDragging.current = false;
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
		if (isTapRef.current && !didLongPress.current) {
			onToggleUI?.();
			isTapRef.current = false;
		}
		if (onCompareEnd) onCompareEnd();
	};

	const handleMouseLeave = () => {
		if (Date.now() - lastTouchTime.current < 1000) return;

		isDragging.current = false;
		isTapRef.current = false;
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
		if (onCompareEnd) onCompareEnd();
	};

	const lastTouchDistance = useRef<number | null>(null);
	const lastTouchCenter = useRef<{ x: number, y: number } | null>(null);

	const getTouchDistance = (touches: React.TouchList) => {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	};

	const getTouchCenter = (touches: React.TouchList) => {
		return {
			x: (touches[0].clientX + touches[1].clientX) / 2,
			y: (touches[0].clientY + touches[1].clientY) / 2,
		};
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		lastTouchTime.current = Date.now();
		if (onInteractionStart) onInteractionStart();
		if (e.cancelable) e.preventDefault();

		if (e.touches.length === 1) {
			lastTouchCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			isTapRef.current = true;
			didLongPress.current = false;

			longPressTimer.current = window.setTimeout(() => {
				if (isTapRef.current && onCompareStart) {
					onCompareStart();
					didLongPress.current = true;
				}
			}, 500);

		} else if (e.touches.length === 2) {
			lastTouchDistance.current = getTouchDistance(e.touches);
			lastTouchCenter.current = getTouchCenter(e.touches);
			isTapRef.current = false;
			if (longPressTimer.current) clearTimeout(longPressTimer.current);
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		lastTouchTime.current = Date.now();
		if (e.cancelable) e.preventDefault();
		const rect = canvasRef.current?.getBoundingClientRect();
		if (!rect) return;

		if (e.touches.length === 1 && lastTouchCenter.current) {
			// Pan
			if (isTapRef.current) {
				const dx = e.touches[0].clientX - startPos.current.x;
				const dy = e.touches[0].clientY - startPos.current.y;
				if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
					isTapRef.current = false;
					if (longPressTimer.current) clearTimeout(longPressTimer.current);
				}
			}

			const dx = e.touches[0].clientX - lastTouchCenter.current.x;
			const dy = e.touches[0].clientY - lastTouchCenter.current.y;
			lastTouchCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

			const ndcDx = dx / rect.width * 2;
			const ndcDy = -(dy / rect.height * 2);

			setTransform(prev => {
				const newPan = { x: prev.pan.x + ndcDx, y: prev.pan.y + ndcDy };
				const clampedPan = clampPan(newPan, prev.zoom);
				return { ...prev, pan: clampedPan };
			});
		} else if (e.touches.length === 2 && lastTouchDistance.current && lastTouchCenter.current) {
			// Pinch Zoom + Pan
			const newDist = getTouchDistance(e.touches);
			const newCenter = getTouchCenter(e.touches);

			const scale = newDist / lastTouchDistance.current;
			const newZoom = Math.min(Math.max(transform.zoom * scale, minZoom), maxZoom);
			const zoomFactor = newZoom / transform.zoom;

			const centerX = (lastTouchCenter.current.x - rect.left) / rect.width * 2 - 1;
			const centerY = -((lastTouchCenter.current.y - rect.top) / rect.height * 2 - 1);

			let newPanX = transform.pan.x * zoomFactor + centerX * (1 - zoomFactor);
			let newPanY = transform.pan.y * zoomFactor + centerY * (1 - zoomFactor);

			const dx = newCenter.x - lastTouchCenter.current.x;
			const dy = newCenter.y - lastTouchCenter.current.y;
			const ndcDx = dx / rect.width * 2;
			const ndcDy = -(dy / rect.height * 2);

			newPanX += ndcDx;
			newPanY += ndcDy;

			const clampedPan = clampPan({ x: newPanX, y: newPanY }, newZoom);
			setTransform({ zoom: newZoom, pan: clampedPan });

			lastTouchDistance.current = newDist;
			lastTouchCenter.current = newCenter;
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		lastTouchTime.current = Date.now();
		if (e.cancelable) e.preventDefault();

		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
		if (isTapRef.current && !didLongPress.current) {
			onToggleUI?.();
			isTapRef.current = false;
		}
		if (onCompareEnd) onCompareEnd();

		lastTouchDistance.current = null;
		lastTouchCenter.current = null;
	};

	return {
		transform,
		setTransform,
		handlers: {
			onWheel: handleWheel,
			onMouseDown: handleMouseDown,
			onMouseMove: handleMouseMove,
			onMouseUp: handleMouseUp,
			onMouseLeave: handleMouseLeave,
			onTouchStart: handleTouchStart,
			onTouchMove: handleTouchMove,
			onTouchEnd: handleTouchEnd
		}
	};
};
