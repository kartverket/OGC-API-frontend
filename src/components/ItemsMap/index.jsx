'use client'

import { useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { useMap } from '@/context/MapProvider';
import { debounce } from '@/utils/helper';
import { transformExtent } from '@/utils/map/helpers';
import { getBboxFromSizeAndPosition, getMouseWheelZoomInteraction, getSizeAndPositionFromBbox } from './helpers';
import { Map } from '@/components';
import styles from './ItemsMap.module.scss';
import { useItems } from '@/context/ItemsProvider';
import { unByKey } from 'ol/Observable';


export default function ItemsMap({ width, height, bbox, onBboxChange }) {
    const map = useMap();
    const { sizeAndPosition, setSizeAndPosition, sizeAndPositionRef, bboxEdit } = useItems();
    const boxElRef = useRef(null);
    const containerElRef = useRef(null);

    useEffect(
        () => {
            if (map === null || bbox === null || !bboxEdit) {
                return;
            }

            const transformed = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
            const sizeAndPosition = getSizeAndPositionFromBbox(map, transformed);

            sizeAndPositionRef.current = sizeAndPosition;
            setSizeAndPosition(sizeAndPosition);
        },
        [map, bbox, bboxEdit]
    );

    const eventListenerKeyRef = useRef(null);

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            const onMoveEnd = debounce(() => {
                const bbox = getBboxFromSizeAndPosition(map, sizeAndPositionRef.current);
                onBboxChange(bbox);
            }, 250);

            if (bboxEdit) {
                eventListenerKeyRef.current = map.on('moveend', onMoveEnd);
            } else {
                unByKey(eventListenerKeyRef.current);
            }
        },
        [map, bboxEdit]
    );

    useEffect(
        () => {
            if (!bboxEdit || boxElRef.current === null) {
                return;
            }

            const boxEl = boxElRef.current.resizableElement.current;
            const mwz = getMouseWheelZoomInteraction(map);

            const onWheel = event => {
                event.preventDefault();

                if (event.target !== boxEl) {
                    return;
                }

                const { x, y } = sizeAndPositionRef.current;
                const mouseX = event.offsetX + x;
                const mouseY = event.offsetY + y;

                mwz.handleEvent({
                    type: 'wheel',
                    deltaY: event.deltaY,
                    originalEvent: event,
                    pixel: [mouseX, mouseY],
                    map
                });
            };

            boxEl.addEventListener('wheel', onWheel);

            return () => {
                boxEl.removeEventListener('wheel', onWheel);
            }
        },
        [map, bboxEdit]
    );

    return (
        <div ref={containerElRef} className={styles.container}>
            <Map
                // defaultExtent={defaultExtent}
                width={width}
                height={height}
            />
            {
                sizeAndPosition && bboxEdit && (
                    <Rnd
                        ref={boxElRef}
                        bounds="parent"
                        size={{ width: sizeAndPosition.width, height: sizeAndPosition.height }}
                        position={{ x: sizeAndPosition.x, y: sizeAndPosition.y }}
                        resizeHandleClasses={{
                            topLeft: styles.resizeTopLeft,
                            topRight: styles.resizeTopRight,
                            bottomLeft: styles.resizeBottomLeft,
                            bottomRight: styles.resizeBottomRight
                        }}
                        onDragStop={(event, data) => {
                            const sizeAndPosition = {
                                width: data.node.offsetWidth,
                                height: data.node.offsetHeight,
                                x: data.x,
                                y: data.y
                            };

                            setSizeAndPosition(sizeAndPosition);
                            sizeAndPositionRef.current = sizeAndPosition;

                            const bbox = getBboxFromSizeAndPosition(map, sizeAndPosition);
                            onBboxChange(bbox);
                        }}
                        onResizeStop={(event, direction, ref, delta, position) => {
                            const sizeAndPosition = {
                                width: ref.offsetWidth,
                                height: ref.offsetHeight,
                                ...position
                            };

                            setSizeAndPosition(sizeAndPosition);
                            sizeAndPositionRef.current = sizeAndPosition;

                            const bbox = getBboxFromSizeAndPosition(map, sizeAndPosition);
                            onBboxChange(bbox);
                        }}
                        className={styles.bbox}
                    >
                    </Rnd>
                )
            }
        </div>
    );
}