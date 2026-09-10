import TileMatrixSetDetails from '@/components/TileMatrixSetDetails';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collection, tileMatrixSet } = await params;

  return { title: `${collection} — ${tileMatrixSet}` };
}

export default async function CollectionTileMatrixSetPage({ params }) {
  const { collection, tileMatrixSet } = await params;

  return <TileMatrixSetDetails collection={collection} tileMatrixSet={tileMatrixSet} styles={styles} />;
}
