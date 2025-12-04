'use client'

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, Heading, Label, Select, Field, Button, Input, Chip, FieldDescription } from '@digdir/designsystemet-react';
import { EqualsIcon, FilterIcon, PencilIcon } from '@navikt/aksel-icons';
import { getControlTypeFromField, getFields, parseBboxStr, validateBbox } from './helpers';
import styles from './FilterCard.module.scss';
import { getExtentFromBBox } from '@/utils/map/map';


export default function FilterCard({ data, bbox, onBboxChange }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedField, setSelectedField] = useState('');
    const [filterValue, setFilterValue] = useState('');

    const [_bbox, setBbox] = useState(() => {
        const bboxStr = searchParams.get('bbox');
        const bbox = bboxStr !== null ? parseBboxStr(bboxStr) : data.collection.extent.bbox;

        if (validateBbox(bbox)) {
            return {
                minLon: bbox[0].toString(),
                minLat: bbox[1].toString(),
                maxLon: bbox[2].toString(),
                maxLat: bbox[3].toString()
            };
        }

        return {
            minLon: '',
            minLat: '',
            maxLon: '',
            maxLat: ''
        };
    });

    useEffect(
        () => {
            if (!bbox) {
                return;
            }

            setBbox({
                minLon: bbox[0].toString(),
                minLat: bbox[1].toString(),
                maxLon: bbox[2].toString(),
                maxLat: bbox[3].toString()
            })
        },
        [bbox]
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

    function removeAllFilters() {
        const filters = [...selectedFilters];
        setSelectedFilters([]);

        const params = new URLSearchParams(searchParams);
        filters.forEach(({ field }) => params.delete(field));

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function removeFilter(index) {
        const filters = [...selectedFilters];
        const filter = filters[index];

        filters.splice(index, 1);
        setSelectedFilters(filters);

        const params = new URLSearchParams(searchParams);
        params.delete(filter.field);

        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function editBbox() {

    }

    function handleFieldSelectChange(event) {
        setFilterValue('');
        setSelectedField(event.target.value);
    }

    function handleBboxChange(event) {
        const updated = {
            ...bbox,
            [event.target.name]: event.target.value
        };

        setBbox(updated);

        const a = Object.values(updated).map(coordinate => parseFloat(coordinate));

        onBboxChange(a);
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
                <div>
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

                    <div className={styles.inputs}>
                        <div>
                            <Label htmlFor="minLon" data-size="sm">Min. lon</Label>
                            <Input
                                type="number"
                                id="minLon"
                                name="minLon"
                                value={_bbox.minLon}
                                onChange={handleBboxChange}
                                data-size="sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="minLat" data-size="sm">Min. lat</Label>
                            <Input
                                type="number"
                                id="minLat"
                                name="minLat"
                                value={_bbox.minLat}
                                onChange={handleBboxChange}
                                data-size="sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="maxLon" data-size="sm">Maks. lon</Label>
                            <Input
                                type="number"
                                id="maxLon"
                                name="maxLon"
                                value={_bbox.maxLon}
                                onChange={handleBboxChange}
                                data-size="sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="maxLat" data-size="sm">Maks. lat</Label>
                            <Input
                                type="number"
                                id="maxLat"
                                name="maxLat"
                                value={_bbox.maxLat}
                                onChange={handleBboxChange}
                                data-size="sm"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={editBbox}
                        variant="secondary"
                        data-size="sm"
                    // disabled={selectedField === '' || filterValue === ''}
                    >
                        <PencilIcon title="Rediger" fontSize="24px" />
                        Rediger BBOX-filter
                    </Button>
                </div>
            </div>
        </Card>
    );
}