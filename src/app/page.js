import Link from 'next/link';
import styles from './page.module.scss';
import { fetchCollections, fetchHome } from '@/utils/api';


async function fetchPageData() {
    const responses = await Promise.all([fetchHome(), fetchCollections()]);

    return {
        ...responses[0],
        collectionCount: responses[1].collections.length
    };
}

export default async function Home() {
    const page = await fetchPageData()

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <h1>{page.title}</h1>
                <p>{page.description}</p>
                <p>
                    <Link href="/collections">Collections ({page.collectionCount})</Link>
                </p>
            </main>
            <footer className={styles.footer}>
            </footer>
        </div>
    );
}
