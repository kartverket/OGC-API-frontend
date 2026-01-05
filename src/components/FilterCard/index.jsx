'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { debounce, roundDecimals } from '@/utils/helper';
import { useMap } from '@/context/MapProvider';
import { useItems } from '@/context/ItemsProvider';
import { getSizeAndPositionFromBbox } from '../ItemsMap/helpers';
import { extend } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import bboxPolygon from '@turf/bbox-polygon';
import booleanWithin from '@turf/boolean-within';
import { setBboxFeature, toggleBboxFeature } from '@/utils/map/featuresLayer';
import { getControlTypeFromField, getFields, getMapViewBounds, isWithinBounds, isBboxValid, parseBbox, getFeaturesExtent, getBboxExtent } from './helpers';
import { Card, Heading, Label, Select, Field, Button, Input, Chip } from '@digdir/designsystemet-react';
import { EqualsIcon, FilterIcon, PencilIcon, XMarkIcon } from '@navikt/aksel-icons';
import styles from './FilterCard.module.scss';


export default function FilterCard({ data, bbox, onBboxChange }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedField, setSelectedField] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [_bbox, setBbox] = useState(bbox.map(coordinate => coordinate.toString()));
    const viewBoundsRef = useRef(null);
    const bboxRef = useRef(null);
    const map = useMap();
    const { setSizeAndPosition, sizeAndPositionRef, bboxEdit, setBboxEdit } = useItems();

    useEffect(
        () => {
            if (bbox !== null) {
                setBbox(bbox.map(coordinate => coordinate.toString()));
            }
        },
        [bbox]
    );

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            const onMoveEnd = debounce(() => {
                viewBoundsRef.current = getMapViewBounds(map);
            }, 250);

            map.on('moveend', onMoveEnd);

            return () => {
                map.un('moveend', onMoveEnd);
            };
        },
        [map]
    );

    const [selectedFilters, setSelectedFilters] = useState(() => {
        const fields = getFields([], data.queryables);

        fields.push('bbox');

        return [...searchParams]
            .filter(entry => fields.includes(entry[0]))
            .map(entry => ({
                field: entry[0],
                value: entry[1]
            }));
    });

    const controlType = useMemo(() => getControlTypeFromField(selectedField, data.queryables), [selectedField, data.queryables]);
    const fields = useMemo(() => getFields(selectedFilters, data.queryables), [selectedFilters, data.queryables]);
    const hasBboxFilter = useMemo(() => selectedFilters.some(filter => filter.field === 'bbox'), [selectedFilters]);

    function addFilter() {
        setSelectedFilters([
            ...selectedFilters,
            { field: selectedField, value: filterValue }
        ]);

        setSelectedField('');
        setFilterValue('');

        const params = new URLSearchParams(searchParams);
        params.set(selectedField, filterValue);

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function addBboxFilter() {
        const field = 'bbox';
        const value = _bbox.join(',');
        const clone = [...selectedFilters];
        const index = clone.findIndex(filter => filter.field === field);

        if (index === -1) {
            setSelectedFilters([
                ...selectedFilters,
                { field, value }
            ]);
        } else {
            clone.splice(index, 1, { field, value });
            setSelectedFilters(clone);
        }

        const parsed = parseBbox(_bbox);        
        bboxRef.current = null;

        setBboxFeature(map, parsed);
        setBboxEdit(false);

        const params = new URLSearchParams(searchParams);
        params.set(field, value);

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function removeAllFilters() {        
        cancelEditBbox();

        const filters = [...selectedFilters];
        setSelectedFilters([]);

        const params = new URLSearchParams(searchParams);
        filters.forEach(({ field }) => params.delete(field));

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function removeFilter(index) {
        const filters = [...selectedFilters];
        const filter = filters[index];

        if (filter.field === 'bbox') {
            cancelEditBbox();
        }

        filters.splice(index, 1);
        setSelectedFilters(filters);

        const params = new URLSearchParams(searchParams);
        params.delete(filter.field);

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function handleFieldSelectChange(event) {
        setFilterValue('');
        setSelectedField(event.target.value);
    }

    function startEditBbox() {
        bboxRef.current = _bbox;
        toggleBboxFeature(map, false);

        const featuresExtent = getFeaturesExtent(map);
        const bboxExtent = getBboxExtent(_bbox);
        const combinedExtent = extend(featuresExtent, bboxExtent)
        const combinedPoly = bboxPolygon(combinedExtent);

        const view = map.getView();
        const viewExtent = view.calculateExtent(map.getSize());
        const viewPoly = bboxPolygon(viewExtent);

        function updateSizeAndPosition() {
            const sizeAndPosition = getSizeAndPositionFromBbox(map, bboxExtent);

            sizeAndPositionRef.current = sizeAndPosition;
            setSizeAndPosition(sizeAndPosition);
            setBboxEdit(true);
        }

        if (booleanWithin(combinedPoly, viewPoly)) {
            updateSizeAndPosition();
        } else {
            view.fit(combinedExtent, map.getSize());

            const key = map.on('moveend', () => {
                updateSizeAndPosition();
                unByKey(key);
            });
        }
    }

    function cancelEditBbox() {
        const parsed = parseBbox(bboxRef.current);
        bboxRef.current = null;

        toggleBboxFeature(map, true);
        setBboxEdit(false);
        onBboxChange(parsed);
    }

    function handleBboxChange(value, index) {
        const clone = [..._bbox];
        clone.splice(index, 1, roundDecimals(value, 6));

        if (!isBboxValid(clone)) {
            return;
        }

        const viewBounds = viewBoundsRef.current;

        if (!isWithinBounds(value, index, viewBounds)) {
            value = viewBounds[index].toString();
            clone.splice(index, 1, roundDecimals(value, 6));
        }

        const parsed = parseBbox(clone);

        setBbox(clone)
        onBboxChange(parsed);
    }

    function renderControl() {
        if (controlType === 'bool') {
            return (
                <Select
                    id="filter-value"
                    value={filterValue}
                    onChange={event => setFilterValue(event.target.value)}
                    data-size="sm"
                >
                    <Select.Option value="" disabled>Velg...</Select.Option>
                    <Select.Option value="true">true</Select.Option>
                    <Select.Option value="false">false</Select.Option>
                </Select>
            );
        }

        return (
            <Input
                id="filter-value"
                type={controlType}
                value={filterValue}
                onChange={event => setFilterValue(event.target.value)}
                disabled={selectedField === ''}
                data-size="sm"
            />
        );
    }

    return (
        <Card className={styles.filterCard}>
            <div className={styles.heading}>
                <FilterIcon title="a11y-title" fontSize="24px" />
                <Heading level={2} data-size="sm">Filter</Heading>
            </div>

            {
                selectedFilters.length > 0 && (
                    <div className={styles.selectedFilters}>
                        <Chip.Button
                            onClick={removeAllFilters}
                            data-size="sm"
                        >
                            Fjern alle filtre
                        </Chip.Button>
                        {
                            selectedFilters.map(({ field, value }, index) => (
                                <Chip.Removable
                                    key={field}
                                    onClick={() => removeFilter(index)}
                                    data-size="sm"
                                >
                                    {field}={value}
                                </Chip.Removable>
                            ))
                        }
                    </div>
                )
            }

            <div className={styles.filters}>
                <div className={styles.fields}>
                    <Field className={styles.fieldSelect}>
                        <Label htmlFor="field-select">Felt</Label>

                        <Select
                            id="field-select"
                            value={selectedField}
                            onChange={handleFieldSelectChange}
                            data-size="sm"
                        >
                            <Select.Option value="" disabled>Velg fra listen...</Select.Option>
                            {
                                fields.map(field => (
                                    <Select.Option key={field} value={field}>{field}</Select.Option>
                                ))
                            }
                        </Select>
                    </Field>

                    <EqualsIcon fontSize="24px" />

                    <Field className={styles.fieldFilter}>
                        <Label htmlFor="filter-value">Filter pattern</Label>
                        {renderControl()}
                    </Field>

                    <Button
                        onClick={addFilter}
                        data-size="sm"
                        disabled={selectedField === '' || filterValue === ''}
                    >
                        Legg til filter
                    </Button>
                </div>

                <div className={styles.bbox}>
                    <Heading level={3} data-size="2xs">Bounding box (BBOX)</Heading>

                    <div className={styles.inputs} style={{ display: bboxEdit ? 'flex' : 'none' }}>
                        <div>
                            <Label htmlFor="minLon" data-size="sm">Min. lon</Label>
                            <Input
                                type="number"
                                id="minLon"
                                value={_bbox[0]}
                                onChange={event => handleBboxChange(event.target.value, 0)}
                                step="any"
                                data-size="sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="minLat" data-size="sm">Min. lat</Label>
                            <Input
                                type="number"
                                id="minLat"
                                value={_bbox[1]}
                                onChange={event => handleBboxChange(event.target.value, 1)}
                                step="any"
                                data-size="sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="maxLon" data-size="sm">Maks. lon</Label>
                            <Input
                                type="number"
                                id="maxLon"
                                value={_bbox[2]}
                                onChange={event => handleBboxChange(event.target.value, 2)}
                                step="any"
                                data-size="sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="maxLat" data-size="sm">Maks. lat</Label>
                            <Input
                                type="number"
                                id="maxLat"
                                value={_bbox[3]}
                                onChange={event => handleBboxChange(event.target.value, 3)}
                                step="any"
                                data-size="sm"
                            />
                        </div>
                    </div>

                    <div className={styles.buttons}>
                        {
                            !bboxEdit && (
                                <Button
                                    onClick={startEditBbox}
                                    variant="secondary"
                                    data-size="sm"
                                >
                                    <PencilIcon title="Rediger" fontSize="24px" />
                                    Rediger BBOX-filter
                                </Button>
                            )
                        }
                        {
                            bboxEdit && (
                                <>
                                    <Button
                                        onClick={cancelEditBbox}
                                        variant="secondary"
                                        data-size="sm"
                                    >
                                        <XMarkIcon title="Avbryt" fontSize="24px" />
                                        Avbryt redigering
                                    </Button>

                                    <Button
                                        onClick={addBboxFilter}
                                        data-size="sm"
                                    >
                                        {!hasBboxFilter ? 'Legg til' : 'Oppdater'} BBOX-filter
                                    </Button>
                                </>
                            )
                        }
                    </div>
                </div>
            </div>
        </Card>
    );
}