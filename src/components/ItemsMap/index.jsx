'use client'

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Rnd } from 'react-rnd';
import { useMap } from '@/context/MapProvider';
import { getExtentFromBBox, setFeatureCollection, zoomToExtent } from '@/utils/map/map';
import { debounce, getExtentFromSizeAndPosition, getMouseWheelZoomInteraction, getSizeAndPositionFromExtent, transformExtent } from './helpers';
import { Map } from '@/components';
import styles from './ItemsMap.module.scss';


export default function ItemsMap({ featureCollection, defaultExtent, bbox, width, height, onExtentChange }) {
    const map = useMap();
    const [extent, setExtent] = useState(null);
    const [sizeAndPosition, setSizeAndPosition] = useState(null);
    const boxElRef = useRef(null);
    const containerElRef = useRef(null);
    const sizeAndPositionRef = useRef(null);

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            setFeatureCollection(map, featureCollection);
            zoomToExtent(map, defaultExtent);
        },
        [map, defaultExtent, featureCollection]
    );

    useEffect(
        () => {
            if (!bbox) {
                return;
            }

            const _defaultExtent = getExtentFromBBox(bbox, 'http://www.opengis.net/def/crs/OGC/1.3/CRS84');
            const sizeAndPosition = getSizeAndPositionFromExtent(map, _defaultExtent);
            const extent = getExtentFromSizeAndPosition(map, sizeAndPosition);
            sizeAndPositionRef.current = sizeAndPosition;

            setSizeAndPosition(sizeAndPosition);
            setExtent(extent);
        },
        [bbox]
    );

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            map.once('postrender', () => {
                const _defaultExtent = getExtentFromBBox(defaultExtent.bbox, defaultExtent.crs);
                const sizeAndPosition = getSizeAndPositionFromExtent(map, _defaultExtent);
                const extent = getExtentFromSizeAndPosition(map, sizeAndPosition);
                sizeAndPositionRef.current = sizeAndPosition;

                setSizeAndPosition(sizeAndPosition);
                setExtent(extent);
            });

            const onMoveEnd = debounce(() => {
                if (sizeAndPositionRef.current !== null) {
                    const extent = getExtentFromSizeAndPosition(map, sizeAndPositionRef.current);
                    setExtent(extent);
                }
            }, 300);

            map.on('moveend', onMoveEnd);

            return () => {
                map.un('moveend', onMoveEnd);
            };
        },
        [map, defaultExtent]
    );

    useEffect(
        () => {
            if (extent === null) {
                return;
            }

            const boxEl = boxElRef.current.resizableElement.current;

            const onWheel = event => {
                event.preventDefault();

                if (event.target !== boxEl) {
                    return;
                }

                const { x, y } = sizeAndPositionRef.current;
                const mouseX = event.offsetX + x;
                const mouseY = event.offsetY + y;
                const mwz = getMouseWheelZoomInteraction(map);

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
        [map, extent]
    );

    function handleExtentChange(index, value) {
        const updated = [...extent]
        updated.splice(index, 1, parseFloat(value));

        setExtent(updated);
        onExtentUpdate(updated);

        const transformed = transformExtent(updated, 'EPSG:4326', 'EPSG:3857');
        const sizeAndPosition = getSizeAndPositionFromExtent(map, transformed);

        setSizeAndPosition(sizeAndPosition);
        sizeAndPositionRef.current = sizeAndPosition;
    }

    return (
        <div ref={containerElRef} className={styles.container}>
            <Map
                defaultExtent={defaultExtent}
                width={width}
                height={height}
            />
            {
                sizeAndPosition && (
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

                            const extent = getExtentFromSizeAndPosition(map, sizeAndPosition);
                            setExtent(extent);
                            onExtentChange(extent);
                        }}
                        onResizeStop={(event, direction, ref, delta, position) => {
                            const sizeAndPosition = {
                                width: ref.offsetWidth,
                                height: ref.offsetHeight,
                                ...position
                            };

                            setSizeAndPosition(sizeAndPosition);
                            sizeAndPositionRef.current = sizeAndPosition;

                            const extent = getExtentFromSizeAndPosition(map, sizeAndPosition);
                            setExtent(extent);
                            onExtentChange(extent);
                        }}
                        className={styles.bbox}
                    >
                    </Rnd>
                )
            }

        </div>

    );
}