export interface Point {
	x: number;
	y: number;
}

/**
 * Monotonic Cubic Spline Interpolation
 * Ensures that the curve does not overshoot the control points (smooth and monotonic).
 */
export class MonotonicSpline {
	private xs: number[];
	private ys: number[];
	private m: number[];

	constructor(points: Point[]) {
		// Sort points by x -- MUST BE STRICTLY INCREASING x usually?
		// Standard Monotonic spline handles distinct X. If X are same, behavior is undefined/bad.
		// We'll filter duplicates or ensure distinctness in UI.
		const sorted = [...points].sort((a, b) => a.x - b.x);

		// Ensure distinct X by tiny offsets if needed
		for (let i = 1; i < sorted.length; i++) {
			if (sorted[i].x <= sorted[i - 1].x) {
				sorted[i].x = sorted[i - 1].x + 0.0001;
			}
		}

		this.xs = sorted.map(p => p.x);
		this.ys = sorted.map(p => p.y);

		const n = sorted.length;
		const m = new Array(n).fill(0);

		// Compute slopes of secant lines between successive points
		const d = new Array(n - 1).fill(0);
		for (let i = 0; i < n - 1; i++) {
			const dx = this.xs[i + 1] - this.xs[i];
			const dy = this.ys[i + 1] - this.ys[i];
			d[i] = dy / dx;
		}

		// Initialize tangents (m) as average of secants
		m[0] = d[0];
		for (let i = 1; i < n - 1; i++) {
			m[i] = (d[i - 1] + d[i]) * 0.5;
		}
		m[n - 1] = d[n - 2];

		// Fix slopes to ensure monotonicity
		for (let i = 0; i < n - 1; i++) {
			if (d[i] === 0) {
				m[i] = 0;
				m[i + 1] = 0;
			} else {
				const alpha = m[i] / d[i];
				const beta = m[i + 1] / d[i];
				const h = Math.hypot(alpha, beta);
				if (h > 3) {
					const tau = 3 / h;
					m[i] = tau * alpha * d[i];
					m[i + 1] = tau * beta * d[i];
				}
			}
		}
		this.m = m;
	}

	interpolate(x: number): number {
		const n = this.xs.length;
		if (x <= this.xs[0]) return this.ys[0];
		if (x >= this.xs[n - 1]) return this.ys[n - 1];

		// Find segment
		let i = 0;
		for (let j = n - 2; j >= 0; j--) {
			if (x >= this.xs[j]) {
				i = j;
				break;
			}
		}

		const h = this.xs[i + 1] - this.xs[i];
		const t = (x - this.xs[i]) / h;
		const t2 = t * t;
		const t3 = t2 * t;

		const h00 = 2 * t3 - 3 * t2 + 1;
		const h10 = t3 - 2 * t2 + t;
		const h01 = -2 * t3 + 3 * t2;
		const h11 = t3 - t2;

		const y = h00 * this.ys[i] +
			h10 * h * this.m[i] +
			h01 * this.ys[i + 1] +
			h11 * h * this.m[i + 1];

		return y;
	}

	/**
	 * Generates a lookup table (array of 256 bytes)
	 */
	getLUT(size: number = 256): Uint8Array {
		const lut = new Uint8Array(size);
		for (let i = 0; i < size; i++) {
			const x = i / (size - 1);
			const y = this.interpolate(x);
			lut[i] = Math.max(0, Math.min(255, Math.round(y * 255)));
		}
		return lut;
	}
}
