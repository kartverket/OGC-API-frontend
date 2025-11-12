import { getLayer } from '@/utils/map/helpers';
import IconExtent from '@/assets/gfx/icon-extent.svg';
import styles from './ZoomToExtent.module.scss';

export default function ZoomToExtent({ map }) {
    function zoomToExtent() {
        const vectorLayer = getLayer(map, 'features');
        const vectorSource = vectorLayer.getSource();
        const features = vectorSource.getFeatures();

        if (features.length > 0) {
            const extent = vectorLayer.getSource().getExtent();
            const view = map.getView();

            view.fit(extent, map.getSize());
        }
    }

    return (
        <button
            className={styles.button}
            onClick={zoomToExtent}
            title="Zoom til kartets utstrekning"
        >
            <IconExtent />
        </button>
    );
}