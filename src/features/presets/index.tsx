import { FloatingPanel } from '../../components/FloatingPanel';
import { type FeatureProps } from '../types';

export const PresetsFeature = (_props: FeatureProps) => {
	return (
		<FloatingPanel activeTab="presets">
			<div className="text-zinc-500 text-center py-8">
				Presets coming soon
			</div>
		</FloatingPanel>
	);
};
