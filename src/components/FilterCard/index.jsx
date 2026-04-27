'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { debounce, roundDecimals } from '@/utils/helper';
import { useItemsMap } from '@/context/ItemsMapProvider';
import { useItems } from '@/context/ItemsProvider';
import { getSizeAndPositionFromBbox } from '../ItemsMap/helpers';
import { extend } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import bboxPolygon from '@turf/bbox-polygon';
import booleanWithin from '@turf/boolean-within';
import { setBboxFeature, toggleBboxFeature } from '@/utils/map/featuresLayer';
import { isBboxValid, parseBbox } from '@/utils/map/helpers';
import { getControlTypeFromField, getFields, getSchemaProperty, getValidationError, getMapViewBounds, isWithinBounds, getFeaturesExtent, getBboxExtent } from './helpers';
import { Card, Heading, Label, Select, Field, Button, Input, Chip } from '@digdir/designsystemet-react';
import { EqualsIcon, FilterIcon, PencilIcon, XMarkIcon } from '@navikt/aksel-icons';
import styles from './FilterCard.module.css';


export default function FilterCard({ data }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const map = useItemsMap();
    const { bbox, setBbox, setSizeAndPosition, sizeAndPositionRef, bboxEdit, setBboxEdit } = useItems();
    const [selectedField, setSelectedField] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [filterError, setFilterError] = useState(null);
    const [bboxFilter, setBboxFilter] = useState(bbox.map(coordinate => coordinate.toString()));
    const viewBoundsRef = useRef(null);
    const bboxRef = useRef(null);

    useEffect(
        () => {
            if (bbox !== null) {
                setBboxFilter(bbox.map(coordinate => coordinate.toString()));
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

    const selectedFilters = useMemo(() => {
        const fields = getFields([], data.queryables);
        fields.push('bbox');

        return [...searchParams]
            .filter(entry => fields.includes(entry[0]))
            .map(entry => ({
                field: entry[0],
                value: entry[1]
            }));
    }, [searchParams, data.queryables]);

    const controlType = useMemo(() => getControlTypeFromField(selectedField, data.queryables, data.schema), [selectedField, data.queryables, data.schema]);
    const schemaProperty = useMemo(() => getSchemaProperty(selectedField, data.schema), [selectedField, data.schema]);
    const fields = useMemo(() => getFields(selectedFilters, data.queryables), [selectedFilters, data.queryables]);
    const hasBboxFilter = useMemo(() => selectedFilters.some(filter => filter.field === 'bbox'), [selectedFilters]);

    function addFilter() {
        setSelectedField('');
        setFilterValue('');

        const params = new URLSearchParams(searchParams);
        params.set(selectedField, filterValue);

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function addBboxFilter() {
        const parsed = parseBbox(bboxFilter);
        bboxRef.current = null;

        setBboxFeature(map, parsed);
        setBboxEdit(false);

        const params = new URLSearchParams(searchParams);
        params.set('bbox', bboxFilter.join(','));

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function removeAllFilters() {
        cancelEditBbox();

        const params = new URLSearchParams(searchParams);
        selectedFilters.forEach(({ field }) => { params.delete(field); });

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function removeFilter(index) {
        const filter = selectedFilters[index];

        if (filter.field === 'bbox') {
            cancelEditBbox();
        }

        const params = new URLSearchParams(searchParams);
        params.delete(filter.field);

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function handleFieldSelectChange(event) {
        setFilterValue('');
        setFilterError(null);
        setSelectedField(event.target.value);
    }

    function handleFilterValueChange(value) {
        setFilterValue(value);
        setFilterError(getValidationError(value, controlType));
    }

    function startEditBbox() {
        bboxRef.current = bboxFilter;
        toggleBboxFeature(map, false);

        const featuresExtent = getFeaturesExtent(map);
        const bboxExtent = getBboxExtent(bboxFilter);
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
        if (bboxRef.current !== null) {
            const parsed = parseBbox(bboxRef.current);
            bboxRef.current = null;
            setBbox(parsed);
        }

        toggleBboxFeature(map, true);
        setBboxEdit(false);
    }

    function handleBboxChange(value, index) {
        const clone = [...bboxFilter];
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

        setBboxFilter(clone)
        setBbox(parsed);
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

        if (controlType === 'select') {
            const enumValues = schemaProperty?.enum ?? [];
            return (
                <Select
                    id="filter-value"
                    value={filterValue}
                    onChange={event => setFilterValue(event.target.value)}
                    data-size="sm"
                    style={{ height: '3rem', overflowY: 'auto' }}
                >
                    <Select.Option value="" disabled>Velg...</Select.Option>
                    {enumValues.map(val => (
                        <Select.Option key={val} value={val}>{val}</Select.Option>
                    ))}
                </Select>
            );
        }

        const example = schemaProperty?.['x-ogc-example'];
        return (
            <>
                <Input
                    id="filter-value"
                    type={controlType}
                    value={filterValue}
                    onChange={event => handleFilterValueChange(event.target.value)}
                    disabled={selectedField === ''}
                    placeholder={example != null ? String(example) : undefined}
                    className={example != null ? styles.exampleInput : undefined}
                    aria-invalid={filterError ? 'true' : undefined}
                    data-size="sm"
                />
                {filterError && (
                    <span className={styles.validationError}>{filterError}</span>
                )}
            </>
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

                    <Field className={controlType === 'select' ? styles.fieldFilterWide : styles.fieldFilter}>
                        <Label htmlFor="filter-value">Filter pattern</Label>
                        {renderControl()}
                    </Field>

                    <Button
                        onClick={addFilter}
                        data-size="sm"
                        disabled={selectedField === '' || filterValue === '' || filterError !== null}
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
                                value={bboxFilter[0]}
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
                                value={bboxFilter[1]}
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
                                value={bboxFilter[2]}
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
                                value={bboxFilter[3]}
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