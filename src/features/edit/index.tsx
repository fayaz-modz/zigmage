import { FloatingPanel } from '../../components/FloatingPanel';
import { EditPanel } from '../../components/EditPanel';
import { editTabs } from './config';
import { type FeatureProps } from '../types';

export const EditFeature = (props: FeatureProps) => {
	return (
		<FloatingPanel
			tabs={editTabs}
			activeTab={props.activeSubMode}
			onTabChange={props.onSubModeChange}
		>
			<EditPanel
				activeSubMode={props.activeSubMode}

				exposure={props.exposure}
				setExposure={props.setExposure}
				contrast={props.contrast}
				setContrast={props.setContrast}
				highlights={props.highlights}
				setHighlights={props.setHighlights}
				shadows={props.shadows}
				setShadows={props.setShadows}
				blacks={props.blacks}
				setBlacks={props.setBlacks}

				temperature={props.temperature}
				setTemperature={props.setTemperature}
				tint={props.tint}
				setTint={props.setTint}
				vibrance={props.vibrance}
				setVibrance={props.setVibrance}
				saturation={props.saturation}
				setSaturation={props.setSaturation}

				onInteractionStart={props.onInteractionStart}
				onInteractionEnd={props.onInteractionEnd}
				isInteracting={props.isInteracting}
				onOpenCurves={props.onOpenCurves}
			/>
		</FloatingPanel>
	);
};
