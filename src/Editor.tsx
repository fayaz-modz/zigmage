import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas, type CanvasRef } from './components/Canvas';
import { MainMenu } from './components/MainMenu';
import { CurvesMenu } from './features/edit/CurvesMenu';
import { CurvesOverlay } from './features/edit/CurvesOverlay';
import { useCurves } from './features/edit/useCurves';
import { MoreVertical, Download, ImagePlus, Upload, Ratio, Maximize, Minimize } from 'lucide-react';
import { FEATURES } from './features/exports';

import { useStatusPill } from './stores/statusStore';

export const Editor = () => {
	const canvasRef = useRef<CanvasRef>(null);

	// Image Params
	const [exposure, setExposure] = useState(0);
	const [contrast, setContrast] = useState(0);
	const [highlights, setHighlights] = useState(0);
	const [shadows, setShadows] = useState(0);
	const [blacks, setBlacks] = useState(0);

	const [temperature, setTemperature] = useState(0);
	const [tint, setTint] = useState(0);
	const [vibrance, setVibrance] = useState(0);
	const [saturation, setSaturation] = useState(0);


	// UI State
	const [activeMode, setActiveMode] = useState<string | null>(null);
	const [displayedMode, setDisplayedMode] = useState<string | null>(null); // Delays unmount for animation
	const [activeSubMode, setActiveSubMode] = useState<string | null>(null);
	const [isUIHidden, setIsUIHidden] = useState(false);
	const [isComparing, setIsComparing] = useState(false);
	const [hasImage, setHasImage] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false); // Keep this for the top-right menu
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [isInteracting, setIsInteracting] = useState(false); // New state for interaction
	const [isLoading, setIsLoading] = useState(false); // Loading state
	const menuRef = useRef<HTMLDivElement>(null); // Keep this for the top-right menu
	const {
		isCurvesOpen,
		setIsCurvesOpen,
		activeCurveChannel,
		setActiveCurveChannel,
		curvePoints,
		setCurvePoints
	} = useCurves(canvasRef as React.RefObject<any>); // Type cast to simplify for now, or match interface properly

	const status = useStatusPill();

	// Close menu on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Handle Full Screen Change
	useEffect(() => {
		const handleFullScreenChange = () => {
			setIsFullScreen(!!document.fullscreenElement);
		};
		document.addEventListener('fullscreenchange', handleFullScreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
	}, []);

	const toggleFullScreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	};

	// Reset or Set default submode when mode changes
	useEffect(() => {
		if (activeMode && FEATURES[activeMode]?.defaultSubMode) {
			setActiveSubMode(FEATURES[activeMode].defaultSubMode);
		} else {
			setActiveSubMode(null);
		}
	}, [activeMode]);

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		await loadBitmap(file);
	};

	const loadBitmap = async (file: File) => {
		try {
			// Show loading immediately when file is selected
			setIsLoading(true);
			const bitmap = await createImageBitmap(file);
			canvasRef.current?.setImage(bitmap);
			setHasImage(true);
			setIsMenuOpen(false);
			// Hide loading after a short delay
			setTimeout(() => setIsLoading(false), 150);
		} catch (err) {
			console.error("Failed to load image", err);
			// Hide loading on error
			setIsLoading(false);
		}
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (file && file.type.startsWith('image/')) {
			await loadBitmap(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const toggleUI = () => {
		if (hasImage) {
			setIsUIHidden(prev => !prev);
			// Also close menu if open
			if (isMenuOpen) setIsMenuOpen(false);
		}
	};

	// Interaction handlers
	const handleInteractionStart = () => {
		setIsInteracting(true);
	};

	const handleInteractionEnd = () => {
		setIsInteracting(false);
	};

	// Delayed unmount: when closing, wait for animation before clearing displayedMode
	useEffect(() => {
		if (activeMode) {
			// Opening: update immediately
			setDisplayedMode(activeMode);
		} else {
			// Closing: delay unmount to let animation play
			const timer = setTimeout(() => setDisplayedMode(null), 300);
			return () => clearTimeout(timer);
		}
	}, [activeMode]);

	const [displayedCurvesOpen, setDisplayedCurvesOpen] = useState(false);
	useEffect(() => {
		if (isCurvesOpen) {
			setDisplayedCurvesOpen(true);
		} else {
			const timer = setTimeout(() => setDisplayedCurvesOpen(false), 300);
			return () => clearTimeout(timer);
		}
	}, [isCurvesOpen]);


	// Determine Active Feature Component (use displayedMode for delayed unmount)
	const ActiveFeature = displayedMode ? FEATURES[displayedMode]?.component : null;

	return (
		<div
			className="relative w-full h-dvh bg-zinc-950 overflow-hidden select-none touch-none"
			onDrop={handleDrop}
			onDragOver={handleDragOver}
		>
			{/* Main Canvas Layer */}
			<div className={`absolute inset-0 z-0 transition-opacity duration-500 ${hasImage ? 'opacity-100' : 'opacity-0'}`}>
				<Canvas
					ref={canvasRef}
					exposure={exposure}
					contrast={contrast}
					highlights={highlights}
					shadows={shadows}
					blacks={blacks}
					temperature={temperature}
					tint={tint}
					vibrance={vibrance}
					saturation={saturation}

					isComparing={isComparing}
					onToggleUI={toggleUI}
					onCompareStart={() => setIsComparing(true)}
					onCompareEnd={() => setIsComparing(false)}
					onInteractionStart={() => setIsMenuOpen(false)}
					menuOffset={(!!activeMode || isCurvesOpen) && !isUIHidden && !isComparing}
				/>
			</div>

			{/* Empty State */}
			{!hasImage && (
				<div className="absolute inset-0 z-0 flex flex-col items-center justify-center text-zinc-400">
					<div className="p-8 border-2 border-dashed border-zinc-700 rounded-3xl flex flex-col items-center gap-4 bg-zinc-900/50 backdrop-blur-sm">
						<div className="p-4 bg-zinc-800 rounded-full">
							<ImagePlus size={48} className="text-zinc-500" />
						</div>
						<div className="text-center">
							<h3 className="text-xl font-bold text-white mb-2">No Image Loaded</h3>
							<p className="text-sm text-zinc-500 mb-6">Drag and drop an image here, or click below</p>
							<label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all inline-flex items-center gap-2">
								<Upload size={20} />
								<span>Open New Image</span>
								<input
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
								/>
							</label>
						</div>
					</div>
				</div>
			)}

			{/* Interaction Status Pill */}
			<div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${status.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
				<div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-full px-4 py-2 flex items-center gap-3 shadow-xl">
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{status.label}</span>
					<div className="w-px h-3 bg-zinc-700" />
					<span className="text-sm font-mono text-white font-medium">{status.value}</span>
				</div>
			</div>

			{/* Top Right Menu Container */}
			<div className={`fixed top-4 right-4 z-50 flex items-center gap-2 pointer-events-auto transition-opacity duration-300 ${isUIHidden || isInteracting || isComparing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
				<div className="flex items-center bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-lg p-1">
					{/* Full Screen Toggle */}
					<button
						onClick={toggleFullScreen}
						className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
						title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
					>
						{isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
					</button>

					<div className="w-px h-6 bg-zinc-700 mx-1" />

					{/* Reset Zoom */}
					<button
						onClick={() => canvasRef.current?.resetTransform()}
						className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
						title="Reset Zoom"
					>
						<Ratio size={20} />
					</button>

					<div className="w-px h-6 bg-zinc-700 mx-1" />

					{/* 3-Dot Menu */}
					<div className="relative" ref={menuRef}>
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
						>
							<MoreVertical size={20} />
						</button>

						{isMenuOpen && (
							<div className="absolute right-0 top-full mt-3 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden flex flex-col py-1">
								<button className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left">
									<Download size={16} />
									<span>Export</span>
								</button>
								<label className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer">
									<ImagePlus size={16} />
									<span>Open New Image</span>
									<input
										type="file"
										accept="image/*"
										onChange={handleImageUpload}
										className="hidden"
									/>
								</label>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* UI Layer */}
			<div className={`absolute inset-0 z-10 pointer-events-none transition-all duration-300 ${isUIHidden || isComparing ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
				<div className="w-full h-full">
					{hasImage && (
						<div className="fixed bottom-0 left-0 right-0 flex flex-col-reverse pointer-events-none z-50">
							{/* Unified MainMenu */}
							<div className={isUIHidden ? 'pointer-events-none' : 'pointer-events-auto'}>
								<MainMenu
									activeMode={activeMode}
									onModeChange={setActiveMode}
									isInteracting={isInteracting}
									contentKey={isCurvesOpen ? 'curves' : (activeMode || 'none')}
									isExpanded={!!activeMode || isCurvesOpen}
								>
									{isCurvesOpen || displayedCurvesOpen ? (
										<div className="w-full">
											<CurvesMenu
												activeChannel={activeCurveChannel}
												onChannelChange={setActiveCurveChannel}
												onDone={() => setIsCurvesOpen(false)}
											/>
										</div>
									) : ActiveFeature ? (
										<ActiveFeature
											activeSubMode={activeSubMode}
											onSubModeChange={setActiveSubMode}

											// Image Params
											exposure={exposure} setExposure={setExposure}
											contrast={contrast} setContrast={setContrast}
											highlights={highlights} setHighlights={setHighlights}
											shadows={shadows} setShadows={setShadows}
											blacks={blacks} setBlacks={setBlacks}

											temperature={temperature} setTemperature={setTemperature}
											tint={tint} setTint={setTint}
											vibrance={vibrance} setVibrance={setVibrance}
											saturation={saturation} setSaturation={setSaturation}

											// Interaction
											onInteractionStart={handleInteractionStart}
											onInteractionEnd={handleInteractionEnd}
											isInteracting={isInteracting}

											// Curves Trigger
											onOpenCurves={() => setIsCurvesOpen(true)}
										/>
									) : null}
								</MainMenu>
							</div>
						</div>
					)}

					{/* Curves Overlay */}
					{hasImage && (
						<CurvesOverlay
							visible={isCurvesOpen && !isUIHidden}
							activeChannel={activeCurveChannel}
							points={curvePoints[activeCurveChannel]}
							onChange={(newPoints) => setCurvePoints(prev => ({ ...prev, [activeCurveChannel]: newPoints }))}
						/>
					)}
				</div>
			</div>

			{/* Loading Overlay - Above everything */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: isLoading ? 1 : 0 }}
				transition={{ duration: 0.2 }}
				className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none"
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
		</div >
	);
};
