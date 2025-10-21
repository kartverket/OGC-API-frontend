import Link from 'next/link';
import { Breadcrumbs as Crumbs, BreadcrumbsItem, BreadcrumbsLink, BreadcrumbsList } from '@digdir/designsystemet-react';
import styles from './Breadcrumbs.module.scss';

export default function Breadcrumbs({ breadcrumbs }) {
    return (
        <div className={styles.container}>
            <Crumbs aria-label="Du er her:" className={styles.breadcrumbs} data-size={'sm'}>
                <BreadcrumbsList>
                    {
                        Object.entries(breadcrumbs).map(breadcrumb => (
                            <BreadcrumbsItem key={breadcrumb[0]}>
                                <BreadcrumbsLink asChild>
                                    <Link  href={breadcrumb[0]}>{breadcrumb[1]}</Link>                                    
                                </BreadcrumbsLink>
                            </BreadcrumbsItem>
                        ))
                    }
                </BreadcrumbsList>
            </Crumbs>
        </div>
    );
}