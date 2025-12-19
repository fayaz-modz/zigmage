import { type LucideIcon } from 'lucide-react';

export interface FeatureProps {
	activeSubMode: string | null;
	onSubModeChange: (id: string | null) => void;

	// Image State
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

	// Interactions
	onInteractionStart: (id?: string) => void;
	onInteractionEnd: () => void;
	isInteracting: boolean;
	onOpenCurves?: () => void;
}

export interface FeatureConfig {
	id: string;
	label: string;
	icon: LucideIcon;
	component: React.ComponentType<FeatureProps>;
	defaultSubMode?: string;
}
