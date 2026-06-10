'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination, Select, SelectOption, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, usePagination } from '@digdir/designsystemet-react';
import { getCurrentPage, getItemsShowingText, getLimit, getLimits } from './helpers';
import styles from './ItemsTable.module.css';
import { useSelector } from 'react-redux';
import { isPlainObject } from '@/utils/helper';

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
    const selectedFeature = useSelector(state => state.map.selectedFeature);
    const features = data.features;
    const columnNames = Object.keys(features[0].properties).filter(key => key !== data.idField);

    const limit = getLimit(searchParams) || parseInt(Object.keys(LIMITS)[0], 10);
    const currentPage = getCurrentPage(searchParams);
    const limits = getLimits(searchParams, LIMITS);
    const totalPages = Math.ceil(data.numberMatched / limit);
    const itemsShowingText = getItemsShowingText(searchParams, LIMITS, data);

    const { pages, prevButtonProps, nextButtonProps } =
        usePagination({
            currentPage,
            setCurrentPage: () => {},
            onChange: handlePaginationChange,
            totalPages,
            showPages: 3,
        });

    function handleLimitChange(value) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('limit', value);
        params.delete('offset');
        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function handlePaginationChange(_, value) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('offset', (value - 1) * limit);
        params.set('limit', limit);
        router.push(`${pathname}?${params}`, { scroll: false });
    }

    function goToItem(id) {
        router.push(`${pathname}/${id}`);
    }

    function formatValue(value) {
        if (value === null) {
            return '-';
        }

        if (isPlainObject(value)) {
            return JSON.stringify(value, null, 2);
        }

        return value.toString();
    }

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <div className={styles.left}>
                    <span>Antall items per side:</span>

                    <Select
                        id="limits"
                        value={limit}
                        onChange={event => handleLimitChange(event.target.value)}
                        data-size="sm"
                    >
                        {
                            limits
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

                <div className={styles.right}>
                    <Pagination>
                        <Pagination.List>
                            <Pagination.Item>
                                <Pagination.Button aria-label="Forrige side" {...prevButtonProps} />
                            </Pagination.Item>
                            {
                                pages.map(({ page, itemKey, buttonProps }) => (
                                    <Pagination.Item key={itemKey}>
                                        {
                                            typeof page === "number" && (
                                                <Pagination.Button
                                                    aria-label={`Side ${page}`} {...buttonProps}
                                                >
                                                    {page}
                                                </Pagination.Button>
                                            )
                                        }
                                    </Pagination.Item>
                                ))
                            }
                            <Pagination.Item>
                                <Pagination.Button aria-label="Neste side" {...nextButtonProps} />
                            </Pagination.Item>
                        </Pagination.List>
                    </Pagination>

                    <span className={styles.itemsShowing}>{itemsShowingText}</span>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <div className={styles.tableViewport}>
                    <Table stickyHeader={true} zebra={true} data-size="sm" className={styles.table}>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell>id</TableHeaderCell>
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
                                    <TableRow 
                                        key={feature.id} 
                                        onClick={() => goToItem(feature.id)} 
                                        className={selectedFeature?.id === feature.id ? styles.selected : ''}
                                    >
                                        <TableCell>{feature.id}</TableCell>
                                        {
                                            Object.entries(feature.properties)
                                                .filter(entry => entry[0] !== data.idField)
                                                .map(entry => (
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