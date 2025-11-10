'use client'

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectOption, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@digdir/designsystemet-react';
import styles from './ItemsTable.module.scss';

const LIMITS = {
    '20': '20 (standard)',
    '50': '50',
    '100': '100',
    '500': '500'
};

export default function ItemsTable({ data }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const features = data.features;
    const columnNames = Object.keys(features[0].properties);
    const [limit, setLimit] = useState(searchParams.get('limit') || Object.keys(LIMITS)[0]);

    const summary = useMemo(
        () => {
            const offset = searchParams.get('offset') || 1;
            const limit = searchParams.get('limit') || Object.keys(LIMITS)[0];

            if (limit === '1') {
                return `Viser ${offset} av ${data.numberMatched}`;
            } 
                
            return `Viser ${offset} - ${data.numberReturned} av ${data.numberMatched}`;
        },
        [searchParams]
    );

    function handleLimitChange(event) {
        const limit = event.target.value;
        setLimit(limit);

        const url = `${pathname}?limit=${limit}`;
        router.replace(url, { scroll: false });
    }

    function goToItem(id) {
        router.push(`${pathname}/${id}`);
    }

    function formatValue(value) {
        return value !== null ? value.toString() : '-';
    }

    return (
        <div>
            <div className={styles.controls}>
                <div className={styles.limit}>
                    <Select
                        value={limit}
                        onChange={handleLimitChange}
                        data-size="sm"
                    >
                        {
                            Object.entries(LIMITS)
                                .map(entry => (
                                    <SelectOption
                                        key={entry[0]}
                                        value={entry[0]}
                                    >
                                        {entry[1]}
                                    </SelectOption>
                                ))
                        }
                    </Select>
                </div>
                {summary}
            </div>

            <div className={styles.tableWrapper}>
                <div className={styles.tableViewport}>
                    <Table stickyHeader={true} zebra={true} data-size="sm" className={styles.table}>
                        <TableHead>
                            <TableRow>
                                {
                                    columnNames.map(name => (
                                        <TableHeaderCell key={name}>{name}</TableHeaderCell>
                                    ))
                                }
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                features.map(feature => (
                                    <TableRow key={feature.id} onClick={() => goToItem(feature.id)}>
                                        {
                                            Object.entries(feature.properties).map(entry => (
                                                <TableCell key={`${feature.id}-${entry[0]}`}>
                                                    <span title={formatValue(entry[1])}>{formatValue(entry[1])}</span>
                                                </TableCell>
                                            ))
                                        }
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}