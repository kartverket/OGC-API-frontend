'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Breadcrumbs as Crumbs, BreadcrumbsItem, BreadcrumbsLink, BreadcrumbsList } from '@digdir/designsystemet-react';
import styles from './Breadcrumbs.module.scss';

export function Breadcrumbs({ breadcrumbs }) {
    const [target, setTarget] = useState(null);

    useEffect(
        () => {
            if (document !== null) {
                setTarget(document.querySelector('header'));
            }
        },
        []
    );

    function renderBreadcrumbs() {
        return (
            <div className={styles.container}>
                <Crumbs aria-label="Du er her:" className={styles.breadcrumbs}>
                    <BreadcrumbsLink
                        aria-label="Tilbake til Nivå 3"
                        href=""
                    >
                        Nivå 3
                    </BreadcrumbsLink>
                    <BreadcrumbsList>
                        <BreadcrumbsItem>
                            <BreadcrumbsLink href="#">
                                Administrative enheter
                            </BreadcrumbsLink>
                        </BreadcrumbsItem>
                        <BreadcrumbsItem>
                            <BreadcrumbsLink href="#">
                                Collections
                            </BreadcrumbsLink>
                        </BreadcrumbsItem>
                    </BreadcrumbsList>
                </Crumbs>
            </div>
        );
    }

    return target ? createPortal(renderBreadcrumbs(), target) : null;
}