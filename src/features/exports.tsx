import { Sliders, Crop, Layers, Eraser, Wand2 } from 'lucide-react';
import { type FeatureConfig } from './types';
import { EditFeature } from './edit';
import { CropFeature } from './crop';
import { PresetsFeature } from './presets';
import { MaskingFeature } from './masking';
import { RemoveFeature } from './remove';

export const FEATURES: Record<string, FeatureConfig> = {
	crop: {
		id: 'crop',
		label: 'Crop',
		icon: Crop,
		component: CropFeature
	},
	presets: {
		id: 'presets',
		label: 'Presets',
		icon: Wand2,
		component: PresetsFeature
	},
	edit: {
		id: 'edit',
		label: 'Edit',
		icon: Sliders,
		component: EditFeature,
		defaultSubMode: 'light'
	},
	masking: {
		id: 'masking',
		label: 'Masking',
		icon: Layers,
		component: MaskingFeature
	},
	remove: {
		id: 'remove',
		label: 'Remove',
		icon: Eraser,
		component: RemoveFeature
	}
};

export const MENU_ITEMS = [
	FEATURES.crop,
	FEATURES.presets,
	FEATURES.edit,
	FEATURES.masking,
	FEATURES.remove
];
