import { FloatingPanel } from '../../components/FloatingPanel';
import { type FeatureProps } from '../types';

export const RemoveFeature = (_props: FeatureProps) => {
	return (
		<FloatingPanel activeTab="remove">
			<div className="text-zinc-500 text-center py-8">
				Removal tools coming soon
			</div>
		</FloatingPanel>
	);
};
