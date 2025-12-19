import { useState, useEffect } from 'react';
import { MonotonicSpline } from '../../lib/spline';
import { type CurveChannel } from './CurvesMenu';

export const useCurves = (canvasRef: React.RefObject<{ setCurves: (lut: Uint8Array) => void }>) => {
	const [isCurvesOpen, setIsCurvesOpen] = useState(false);
	const [activeCurveChannel, setActiveCurveChannel] = useState<CurveChannel>('master');
	const [curvePoints, setCurvePoints] = useState<{ [key in CurveChannel]: { x: number, y: number }[] }>({
		master: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
		red: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
		green: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
		blue: [{ x: 0, y: 0 }, { x: 1, y: 1 }]
	});

	useEffect(() => {
		if (!canvasRef.current) return;

		// Generate LUT
		const masterSpline = new MonotonicSpline(curvePoints.master);
		const redSpline = new MonotonicSpline(curvePoints.red);
		const greenSpline = new MonotonicSpline(curvePoints.green);
		const blueSpline = new MonotonicSpline(curvePoints.blue);

		const lut = new Uint8Array(256 * 4);

		for (let i = 0; i < 256; i++) {
			const x = i / 255;

			// Master curve affects all channels first
			const m = masterSpline.interpolate(x);
			const mc = Math.max(0, Math.min(1, m));

			// Then individual channels
			const r = redSpline.interpolate(mc);
			const g = greenSpline.interpolate(mc);
			const b = blueSpline.interpolate(mc);

			lut[i * 4 + 0] = Math.max(0, Math.min(255, Math.round(r * 255)));
			lut[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
			lut[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
			lut[i * 4 + 3] = 255;
		}

		canvasRef.current.setCurves(lut);
	}, [curvePoints, canvasRef]);

	return {
		isCurvesOpen,
		setIsCurvesOpen,
		activeCurveChannel,
		setActiveCurveChannel,
		curvePoints,
		setCurvePoints
	};
};
