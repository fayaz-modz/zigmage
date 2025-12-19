export class ZigmageEngine {
	private gl: WebGL2RenderingContext | null = null;
	private memory: WebAssembly.Memory | null = null;
	private animationFrameId: number | null = null;
	private initialized = false;

	// WebGL Resources (We keep these for the `env` imports but logic is in Zig)
	private glTextures: WebGLTexture[] = [];
	private glShaders: WebGLShader[] = [];
	private glPrograms: WebGLProgram[] = [];
	private glUniformLocations: WebGLUniformLocation[] = [];
	private glVertexArrays: WebGLVertexArrayObject[] = [];
	private glBuffers: WebGLBuffer[] = [];

	// WASM Exports
	private exports: {
		alloc?: (size: number) => number;
		free?: (ptr: number, size: number) => void;
		addLayer?: (w: number, h: number, ptr: number) => void;
		resetLayers?: () => void;

		// Individual setters
		setExposure?: (val: number) => void;
		setContrast?: (val: number) => void;
		setHighlights?: (val: number) => void;
		setShadows?: (val: number) => void;
		setBlacks?: (val: number) => void;
		setTemperature?: (val: number) => void;
		setTint?: (val: number) => void;
		setVibrance?: (val: number) => void;
		setSaturation?: (val: number) => void;

		setTransform?: (sx: number, sy: number, px: number, py: number) => void;
		updateViewport?: (w: number, h: number) => void;
		setCrop?: (x: number, y: number, w: number, h: number) => void;
		setCurves?: (ptr: number) => void;
		render?: (time: number) => void;
		init?: () => void;
	} = {};

	private pendingImage: { width: number, height: number, data: Uint8ClampedArray } | null = null;

	constructor() { }

	async init(canvas: HTMLCanvasElement) {
		if (this.initialized) return;

		this.gl = canvas.getContext('webgl2');
		if (!this.gl) {
			console.error('WebGL2 not supported');
			return;
		}

		await this.loadWasm();
		this.initialized = true;

		if (this.pendingImage) {
			this.addLayer(this.pendingImage.width, this.pendingImage.height, this.pendingImage.data);
			this.pendingImage = null;
		}

		// Start Render Loop
		const loop = (time: number) => {
			// Ensure viewport is updated if canvas resizes (simple check or ResizeObserver in React side better, but here we can at least set it once)
			// But for now, valid init.
			if (this.exports.render) {
				this.exports.render(time);
			}
			this.animationFrameId = requestAnimationFrame(loop);
		};

		// Initial viewport update
		this.updateViewport(canvas.width, canvas.height);
		this.animationFrameId = requestAnimationFrame(loop);
	}

	destroy() {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
		}
		this.initialized = false;
	}

	private async loadWasm() {
		try {
			// Define environment for WASM
			const env = {
				glClearColor: (r: number, g: number, b: number, a: number) => this.gl?.clearColor(r, g, b, a),
				glClear: (mask: number) => this.gl?.clear(mask),
				glViewport: (x: number, y: number, w: number, h: number) => this.gl?.viewport(x, y, w, h),
				glCreateShader: (type: number) => {
					if (!this.gl) return 0;
					const shader = this.gl.createShader(type);
					if (!shader) return 0;
					this.glShaders.push(shader);
					return this.glShaders.length;
				},
				glShaderSource: (shaderId: number, count: number, stringPtr: number, _lengthPtr: number) => {
					if (!this.memory || !this.gl) return;
					const shader = this.glShaders[shaderId - 1];
					if (!shader) return;

					let source = "";
					const ptrs = new Uint32Array(this.memory.buffer, stringPtr, count);
					for (let i = 0; i < count; i++) {
						const strPtr = ptrs[i];
						const buffer = new Uint8Array(this.memory.buffer);
						let ptr = strPtr;
						while (buffer[ptr] !== 0) {
							source += String.fromCharCode(buffer[ptr]);
							ptr++;
						}
					}
					this.gl.shaderSource(shader, source);
				},
				glCompileShader: (shaderId: number) => {
					const shader = this.glShaders[shaderId - 1];
					if (shader && this.gl) {
						this.gl.compileShader(shader);
						if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
							console.error("Shader compile error:", this.gl.getShaderInfoLog(shader));
						}
					}
				},
				glAttachShader: (programId: number, shaderId: number) => {
					const program = this.glPrograms[programId - 1];
					const shader = this.glShaders[shaderId - 1];
					if (program && shader && this.gl) this.gl.attachShader(program, shader);
				},
				glCreateProgram: () => {
					if (!this.gl) return 0;
					const program = this.gl.createProgram();
					if (!program) return 0;
					this.glPrograms.push(program);
					return this.glPrograms.length;
				},
				glLinkProgram: (programId: number) => {
					const program = this.glPrograms[programId - 1];
					if (program && this.gl) {
						this.gl.linkProgram(program);
						if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
							console.error("Program link error:", this.gl.getProgramInfoLog(program));
						}
					}
				},
				glUseProgram: (programId: number) => {
					const program = this.glPrograms[programId - 1];
					if (program && this.gl) this.gl.useProgram(program);
				},
				glGetShaderParameter: () => { },
				glGetProgramParameter: () => { },
				glGenTextures: (n: number, textures: number) => {
					if (!this.memory || !this.gl) return;
					const view = new Uint32Array(this.memory.buffer, textures, n);
					for (let i = 0; i < n; i++) {
						const texture = this.gl.createTexture();
						if (texture) {
							this.glTextures.push(texture);
							view[i] = this.glTextures.length;
						}
					}
				},
				glDeleteTextures: (n: number, textures: number) => {
					if (!this.memory || !this.gl) return;
					const view = new Uint32Array(this.memory.buffer, textures, n);
					for (let i = 0; i < n; i++) {
						const texture = this.glTextures[view[i] - 1];
						if (texture) {
							this.gl.deleteTexture(texture);
							// We don't remove from glTextures array to keep indices stable? 
							// Actually, if we use indices into an array, removing depends on how we manage IDs.
							// Current `glGenTextures` pushes to array and uses index+1 as ID.
							// If we delete, we should probably null it out or something.
							// But for now, just deleting the GL object is enough to stop rendering if used, but we are clearing the IDs from Zig state anyway.
							// The ID will point to a deleted texture (or we leave the JS object there but invalid?).
							// Ideally, we should zero it out in `glTextures`.
							this.glTextures[view[i] - 1] = null as any;
						}
					}
				},
				glBindTexture: (target: number, textureId: number) => {
					const texture = this.glTextures[textureId - 1];
					// Handle potential null from deletion
					if (texture && this.gl) this.gl.bindTexture(target, texture);
				},
				glTexImage2D: (target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, pixels: number) => {
					if (!this.memory || !this.gl) return;
					const buffer = new Uint8Array(this.memory.buffer, pixels, width * height * 4);
					this.gl.texImage2D(target, level, internalformat, width, height, border, format, type, buffer);
				},
				glTexParameteri: (target: number, pname: number, param: number) => {
					this.gl?.texParameteri(target, pname, param);
				},
				glActiveTexture: (texture: number) => {
					this.gl?.activeTexture(texture);
				},
				glGenerateMipmap: (target: number) => {
					this.gl?.generateMipmap(target);
				},
				glUniform1i: (location: number, v0: number) => {
					if (location === -1 || !this.gl) return;
					this.gl.uniform1i(this.glUniformLocations[location], v0);
				},
				glUniform1f: (location: number, v0: number) => {
					if (location === -1 || !this.gl) return;
					this.gl.uniform1f(this.glUniformLocations[location], v0);
				},
				glUniform2f: (location: number, v0: number, v1: number) => {
					if (location === -1 || !this.gl) return;
					this.gl.uniform2f(this.glUniformLocations[location], v0, v1);
				},
				glUniform4f: (location: number, v0: number, v1: number, v2: number, v3: number) => {
					if (location === -1 || !this.gl) return;
					this.gl.uniform4f(this.glUniformLocations[location], v0, v1, v2, v3);
				},
				glGetUniformLocation: (programId: number, namePtr: number) => {
					if (!this.memory || !this.gl) return -1;
					let name = "";
					const buffer = new Uint8Array(this.memory.buffer);
					let ptr = namePtr;
					while (buffer[ptr] !== 0) {
						name += String.fromCharCode(buffer[ptr]);
						ptr++;
					}
					const program = this.glPrograms[programId - 1];
					if (!program) return -1;
					const location = this.gl.getUniformLocation(program, name);
					if (!location) return -1;
					this.glUniformLocations.push(location);
					return this.glUniformLocations.length - 1;
				},
				glGenVertexArrays: (n: number, arrays: number) => {
					if (!this.memory || !this.gl) return;
					const view = new Uint32Array(this.memory.buffer, arrays, n);
					for (let i = 0; i < n; i++) {
						const vao = this.gl.createVertexArray();
						if (vao) {
							this.glVertexArrays.push(vao);
							view[i] = this.glVertexArrays.length;
						}
					}
				},
				glBindVertexArray: (arrayId: number) => {
					const vao = this.glVertexArrays[arrayId - 1];
					if (vao && this.gl) this.gl.bindVertexArray(vao);
					else this.gl?.bindVertexArray(null);
				},
				glGenBuffers: (n: number, buffers: number) => {
					if (!this.memory || !this.gl) return;
					const view = new Uint32Array(this.memory.buffer, buffers, n);
					for (let i = 0; i < n; i++) {
						const buffer = this.gl.createBuffer();
						if (buffer) {
							this.glBuffers.push(buffer);
							view[i] = this.glBuffers.length;
						}
					}
				},
				glBindBuffer: (target: number, bufferId: number) => {
					const buffer = this.glBuffers[bufferId - 1];
					if (buffer && this.gl) this.gl.bindBuffer(target, buffer);
					else this.gl?.bindBuffer(target, null);
				},
				glBufferData: (target: number, size: number, dataPtr: number, usage: number) => {
					if (!this.memory || !this.gl) return;
					const data = new Uint8Array(this.memory.buffer, dataPtr, size);
					this.gl.bufferData(target, data, usage);
				},
				glVertexAttribPointer: (index: number, size: number, type: number, normalized: number, stride: number, offset: number) => {
					this.gl?.vertexAttribPointer(index, size, type, normalized !== 0, stride, offset);
				},
				glEnableVertexAttribArray: (index: number) => {
					this.gl?.enableVertexAttribArray(index);
				},
				glDrawArrays: (mode: number, first: number, count: number) => {
					this.gl?.drawArrays(mode, first, count);
				},
				consoleLog: (ptr: number, len: number) => {
					if (!this.memory) return;
					const buffer = new Uint8Array(this.memory.buffer, ptr, len);
					console.log(new TextDecoder().decode(buffer));
				}
			};

			const response = await fetch('/zigmage/zigmage.wasm');
			const { instance } = await WebAssembly.instantiateStreaming(response, { env });

			this.memory = instance.exports.memory as WebAssembly.Memory;

			// Map exports
			this.exports.init = instance.exports.init as () => void;
			this.exports.render = instance.exports.render as (time: number) => void;
			this.exports.alloc = instance.exports.alloc as (size: number) => number;
			this.exports.free = instance.exports.free as (ptr: number, size: number) => void;
			this.exports.addLayer = instance.exports.addLayer as (w: number, h: number, ptr: number) => void;
			this.exports.resetLayers = instance.exports.resetLayers as () => void;

			this.exports.setExposure = instance.exports.setExposure as (v: number) => void;
			this.exports.setContrast = instance.exports.setContrast as (v: number) => void;
			this.exports.setHighlights = instance.exports.setHighlights as (v: number) => void;
			this.exports.setShadows = instance.exports.setShadows as (v: number) => void;
			this.exports.setBlacks = instance.exports.setBlacks as (v: number) => void;
			this.exports.setTemperature = instance.exports.setTemperature as (v: number) => void;
			this.exports.setTint = instance.exports.setTint as (v: number) => void;
			this.exports.setVibrance = instance.exports.setVibrance as (v: number) => void;
			this.exports.setSaturation = instance.exports.setSaturation as (v: number) => void;

			this.exports.setVibrance = instance.exports.setVibrance as (v: number) => void;
			this.exports.setSaturation = instance.exports.setSaturation as (v: number) => void;

			this.exports.setTransform = instance.exports.setTransform as (sx: number, sy: number, px: number, py: number) => void;
			this.exports.updateViewport = instance.exports.updateViewport as (w: number, h: number) => void;
			this.exports.setCrop = instance.exports.setCrop as (x: number, y: number, w: number, h: number) => void;
			this.exports.setCurves = instance.exports.setCurves as (ptr: number) => void;

			// Initialize WASM
			if (this.exports.init) this.exports.init();

		} catch (err) {
			console.error('Failed to load Wasm:', err);
		}
	}

	// Public API methods

	// Add a new layer from image data
	addLayer(width: number, height: number, data: Uint8ClampedArray) {
		if (!this.initialized || !this.exports.alloc || !this.exports.addLayer || !this.memory) {
			this.pendingImage = { width, height, data };
			return;
		}

		const ptr = this.exports.alloc(data.length);
		const buffer = new Uint8Array(this.memory.buffer, ptr, data.length);
		buffer.set(data);
		this.exports.addLayer(width, height, ptr);
		// Note: We're not freeing immediately because Zig takes ownership or uses it for texture creation.
		// Actually, Zig copies to texture, so we SHOULD free if Zig doesn't need it after texture gen.
		// `createTexture` in Zig (now `addLayer`) uploads to GPU immediately.
		// So we can free the WASM memory buffer for the pixels.
		// But in the current `addLayer` impl, I didn't add `free` inside it, nor did I export `free` from Zig.
		// Wait, I did export `free` in `main.zig`.
		if (this.exports.free) {
			this.exports.free(ptr, data.length);
		}
	}

	resetLayers() {
		if (this.exports.resetLayers) {
			this.exports.resetLayers();
		}
	}

	// Compatibility method for existing code (treats as adding a layer)
	loadImage(width: number, height: number, data: Uint8ClampedArray) {
		this.addLayer(width, height, data);
	}

	updateFullParams(p: {
		exposure: number, contrast: number, highlights: number, shadows: number, blacks: number,
		temperature: number, tint: number, vibrance: number, saturation: number
	}) {
		if (!this.initialized) return;

		this.setExposure(p.exposure);
		this.setContrast(p.contrast);
		this.setHighlights(p.highlights);
		this.setShadows(p.shadows);
		this.setBlacks(p.blacks);
		this.setTemperature(p.temperature);
		this.setTint(p.tint);
		this.setVibrance(p.vibrance);
		this.setSaturation(p.saturation);
	}

	// Individual Setters
	setExposure(val: number) { this.exports.setExposure?.(val); }
	setContrast(val: number) { this.exports.setContrast?.(val); }
	setHighlights(val: number) { this.exports.setHighlights?.(val); }
	setShadows(val: number) { this.exports.setShadows?.(val); }
	setBlacks(val: number) { this.exports.setBlacks?.(val); }
	setTemperature(val: number) { this.exports.setTemperature?.(val); }
	setTint(val: number) { this.exports.setTint?.(val); }
	setVibrance(val: number) { this.exports.setVibrance?.(val); }
	setSaturation(val: number) { this.exports.setSaturation?.(val); }

	updateTransform(scaleX: number, scaleY: number, panX: number, panY: number) {
		if (this.exports.setTransform) {
			this.exports.setTransform(scaleX, scaleY, panX, panY);
		}
	}

	setCrop(x: number, y: number, w: number, h: number) {
		if (this.exports.setCrop) {
			this.exports.setCrop(x, y, w, h);
		}
	}

	updateViewport(width: number, height: number) {
		if (this.exports.updateViewport) {
			this.exports.updateViewport(width, height);
		}
	}

	setCurves(data: Uint8Array) {
		if (!this.initialized || !this.exports.alloc || !this.exports.setCurves || !this.memory) return;

		const ptr = this.exports.alloc(data.length);
		const buffer = new Uint8Array(this.memory.buffer, ptr, data.length);
		buffer.set(data);

		this.exports.setCurves(ptr);

		if (this.exports.free) {
			this.exports.free(ptr, data.length);
		}
	}

	getMaxTextureSize(): number {
		if (!this.gl) return 0;
		return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
	}
}
