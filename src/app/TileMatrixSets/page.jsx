import {
  Heading,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@digdir/designsystemet-react';
import { Breadcrumbs, ErrorPage } from '@/components';
import { fetchTileMatrixSetsPageData } from '@/services/pageData';
import { createTileMatrixSetsMetadata } from '@/services/pageMetadata';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const generateMetadata = async () => createTileMatrixSetsMetadata();

export default async function TileMatrixSets() {
  const { data, status } = await fetchTileMatrixSetsPageData();

  if (status !== 200) {
    return <ErrorPage status={status} />;
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': data.dataset.title,
          '/TileMatrixSets': 'Tile Matrix Sets',
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm">
          Tile matrix sets available in this service / Flismatrisesett som er tilgjengelig i denne tjenesten
        </Heading>

        <div className={styles.tableWrapper}>
          <Table zebra data-size="sm" className={styles.table}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Tittel</TableHeaderCell>
                <TableHeaderCell>Beskrivelse</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.tileMatrixSets ?? []).map((matrixSet) => (
                <TableRow key={matrixSet.id}>
                  <TableCell>
                    <Link href={`/TileMatrixSets/${matrixSet.id}`}>{matrixSet.id}</Link>
                  </TableCell>
                  <TableCell>{matrixSet.title || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
