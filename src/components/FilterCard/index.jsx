'use client'

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, Heading, Label, Select, Field, Button, Input, Chip } from '@digdir/designsystemet-react';
import { EqualsIcon, FilterIcon } from '@navikt/aksel-icons';
import { getControlTypeFromField, getFields } from './helpers';
import styles from './FilterCard.module.scss';

export default function FilterCard({ data }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedField, setSelectedField] = useState('');
    const [filterValue, setFilterValue] = useState('');

    const [selectedFilters, setSelectedFilters] = useState(() => {
        const fields = getFields([], data.queryables);

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

    function handleFieldSelectChange(event) {
        setFilterValue('');
        setSelectedField(event.target.value);
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

            <div className={styles.fields}>
                <div>
                    <Field className={styles.fieldSelect}>
                        <Label htmlFor="field-select" size="small">Felt</Label>

                        <Select
                            id="field-select"
                            size="small"
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
                        <Label htmlFor="filter-value" size="small">Filter pattern</Label>
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
            </div>
        </Card>
    );
}