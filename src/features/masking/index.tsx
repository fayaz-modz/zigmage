import { FloatingPanel } from '../../components/FloatingPanel';
import { maskingTabs } from './config';
import { type FeatureProps } from '../types';

export const MaskingFeature = (props: FeatureProps) => {
	return (
		<FloatingPanel
			tabs={maskingTabs}
			activeTab={props.activeSubMode}
			onTabChange={props.onSubModeChange}
		>
			<div className="text-zinc-500 text-center py-8">
				Masking tools coming soon
			</div>
		</FloatingPanel>
	);
};
