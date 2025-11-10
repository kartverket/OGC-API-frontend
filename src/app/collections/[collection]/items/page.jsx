import { fetcher, fetchHome, fetchItems } from '@/utils/api';
import { getItemsApiUrl, getCollectionApiUrl, getCollectionId } from './helpers';
import { Heading, Table, Select, Label, Field, Pagination } from '@digdir/designsystemet-react';
import { Breadcrumbs, ItemsTable, Map } from '@/components';
import styles from './page.module.scss';
import FilterCard from '@/components/FilterCard';

async function fetchPageData(collection, searchParams) {
    const promises = [
        fetchHome(),
        fetchItems(collection, searchParams)
    ];

    const result = await Promise.all(promises);

    return {
        ...result[1],
        datasetTitle: result[0].title
    }
}

export default async function Items({ params, searchParams }) {
    const { collection } = await params;
    const _searchParams = await searchParams;
    const data = await fetchPageData(collection, _searchParams);
    const collectionTitle = data.links.find(link => link.rel === 'collection').title;

    // const { slug } = use(params);
    // const router = useRouter();
    // const pathname = usePathname();
    // const searchParams = useSearchParams();
    // const collectionId = getCollectionId(pathname);
    // const limitParam = searchParams.get('limit');
    // const limit = limitParam != null ? Number(limitParam) : undefined;
    // const itemsUrl = useMemo(() => getItemsApiUrl(slug, searchParams), [slug, searchParams]);
    // const { data: collection = null } = useSWR(getCollectionApiUrl(collectionId), fetcher);
    // const { data: items = null } = useSWR(itemsUrl, fetcher);

    // if (!collection || !items) return null;

    // const total =
    //     items?.numberMatched ??
    //     items?.total ??
    //     (Array.isArray(items?.features) ? items.features.length : 0);

    // const showSelect = total >= 20;

    // function onLimitChange(e) {
    //     const v = e.target.value;
    //     const next = new URLSearchParams(searchParams.toString());
    //     if (v === 'all') next.delete('limit');
    //     else next.set('limit', v);
    //     router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    // }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.datasetTitle,
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: collectionTitle,
                    [`/collections/${collection}/items`]: 'Items',
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{collectionTitle}</Heading>

                <div className={styles.top}>
                    <div className={styles.topLeft}>
                        <Map
                            featureCollection={data}
                            width={567}
                            height={675}
                        />
                    </div>
                    <div className={styles.topRight}></div>
                </div>

                <div className={styles.bottom}>
                    {
                        data.features.length > 0 && (
                            <ItemsTable data={data} />
                        )
                    }
                </div>
            </div>
        </>
    );
}