import { LightControls } from '../features/edit/LightControls';
import { ColorControls } from '../features/edit/ColorControls';

interface EditPanelProps {
	activeSubMode: string | null;

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
	onOpenCurves?: () => void;
}

export const EditPanel = ({
	activeSubMode,
	exposure, setExposure,
	contrast, setContrast,
	highlights, setHighlights,
	shadows, setShadows,
	blacks, setBlacks,
	temperature, setTemperature,
	tint, setTint,
	vibrance, setVibrance,
	saturation, setSaturation,
	onInteractionStart,
	onInteractionEnd,
	isInteracting,
	onOpenCurves
}: EditPanelProps) => {

	if (!activeSubMode) return null;

	switch (activeSubMode) {
		case 'light':
			return (
				<LightControls
					exposure={exposure} setExposure={setExposure}
					contrast={contrast} setContrast={setContrast}
					highlights={highlights} setHighlights={setHighlights}
					shadows={shadows} setShadows={setShadows}
					blacks={blacks} setBlacks={setBlacks}
					onInteractionStart={onInteractionStart}
					onInteractionEnd={onInteractionEnd}
					isInteracting={isInteracting}
					onOpenCurves={onOpenCurves}
				/>
			);
		case 'color':
			return (
				<ColorControls
					temperature={temperature} setTemperature={setTemperature}
					tint={tint} setTint={setTint}
					vibrance={vibrance} setVibrance={setVibrance}
					saturation={saturation} setSaturation={setSaturation}
					onInteractionStart={onInteractionStart}
					onInteractionEnd={onInteractionEnd}
					isInteracting={isInteracting}
				/>
			);
		default:
			return <div className="text-zinc-500 text-xs text-center py-4">Controls for {activeSubMode} coming soon</div>;
	}
};
