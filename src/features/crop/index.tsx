import { FloatingMenu } from '../../components/FloatingMenu';
import { cropItems } from './config';
import { type FeatureProps } from '../types';

export const CropFeature = (props: FeatureProps) => {
	return (
		<FloatingMenu
			items={cropItems}
			activeId={props.activeSubMode}
			onItemChange={props.onSubModeChange}
		/>
	);
};
