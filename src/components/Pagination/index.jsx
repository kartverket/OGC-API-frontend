import { usePagination, Pagination as DsPagination } from '@digdir/designsystemet-react';
import { useState } from 'react';

export default function Pagination() {
    const [currentPage, setCurrentPage] = useState();
    
    const { pages, prevButtonProps, nextButtonProps, hasNext, hasPrevious } =
        usePagination({
            currentPage,
            setCurrentPage,
            onChange: handlePaginationChange,
            totalPages,
            showPages: 3,
        });

    return (
        <DsPagination>
            <DsPagination.List>
                <DsPagination.Item>
                    <DsPagination.Button
                        aria-label="Forrige side" {...prevButtonProps}
                    >
                        Forrige
                    </DsPagination.Button>
                </DsPagination.Item>
                {
                    pages.map(({ page, itemKey, buttonProps }) => (
                        <DsPagination.Item key={itemKey}>
                            {
                                typeof page === "number" && (
                                    <DsPagination.Button
                                        aria-label={`Side ${page}`} {...buttonProps}
                                    >
                                        {page}
                                    </DsPagination.Button>
                                )
                            }
                        </DsPagination.Item>
                    ))
                }
                <DsPagination.Item>
                    <DsPagination.Button
                        aria-label="Neste side" {...nextButtonProps}
                    >
                        Neste
                    </DsPagination.Button>
                </DsPagination.Item>
            </DsPagination.List>
        </DsPagination>
    );
}