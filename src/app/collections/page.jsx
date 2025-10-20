import Link from 'next/link';
import { Table, TableHead, TableRow, TableBody, TableCell, TableHeaderCell } from '@digdir/designsystemet-react';
import { fetchCollections } from '@/utils/api';
import styles from './page.module.scss';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
    title: 'Collections | Administrative enheter | OGC API | Kartverket',
    icons: {
        icon: '/gfx/favicon.png'
    }
};


export default async function Collections() {
    const page = await fetchCollections()

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>
                                Navn
                            </TableHeaderCell>
                            <TableHeaderCell>
                                Beskrivelse
                            </TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            page.collections.map(collection => (
                                <TableRow key={collection.id}>
                                    <TableCell>
                                        <Link href={`/collections/${collection.id}`}>{collection.title}</Link>
                                    </TableCell>
                                    <TableCell>{collection.description}</TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </main>
        </div>
    );
}
