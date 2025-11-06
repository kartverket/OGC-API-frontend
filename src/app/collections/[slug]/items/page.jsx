'use client';

import { use, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { getItemsApiUrl, getCollectionApiUrl, getCollectionId } from './helpers';
import { Heading, Table, Select, Label, Field, Pagination } from '@digdir/designsystemet-react';
import { Breadcrumbs, Map } from '@/components';
import styles from './page.module.scss';

function DynamicFeatureTable({ items, limit }) {
  if (!items?.features?.length) return null;

  const useLimit = Number.isFinite(limit) ? limit : undefined;
  const features = useLimit ? items.features.slice(0, useLimit) : items.features;

  const firstProps = features[0]?.properties ?? {};
  const keys = Object.keys(firstProps);
  const hasObjId = keys.includes('objid');
  const orderedKeys = hasObjId ? ['objid', ...keys.filter((k) => k !== 'objid')] : keys;

  return (
    <div className={styles.tableViewport}>
      <Table stickyHeader className={styles.dataTable} data-size="sm">
        <Table.Head>
          <Table.Row>
            {orderedKeys.map((key, idx) => (
              <Table.HeaderCell
                key={key}
                className={idx === 0 ? `${styles.stickyCol} ${styles.stickyCorner}` : undefined}
              >
                {key.toUpperCase()}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Head>

        <Table.Body>
          {features.map((item, i) => {
            const rowKey =
              item.id ??
              item.properties?.objid ??
              item.properties?.uuid ??
              item.properties?.id ??
              `row-${i}`;
            return (
              <Table.Row key={rowKey}>
                {orderedKeys.map((key, idx) => (
                  <Table.Cell
                    key={key}
                    className={idx === 0 ? styles.stickyCol : undefined}
                  >
                    {item.properties?.[key] ?? '—'}
                  </Table.Cell>
                ))}
              </Table.Row>
            );
          })}
        </Table.Body>

        <Table.Foot>
          <Table.Row>
            <Table.HeaderCell colSpan={orderedKeys.length}>
              Viser {features.length} {features.length === 1 ? 'rad' : 'rader'}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Foot>
      </Table>
    </div>
  );
}

/* --------------------- Dummy Pager for design --------------------- */
function Pager() {
  return (
    <Pagination className={styles.pager}>
      <Pagination.List>
        <Pagination.Item>
          <Pagination.Button aria-label="Forrige side">Forrige</Pagination.Button>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Button aria-label="Side 1">1</Pagination.Button>
        </Pagination.Item>
        <Pagination.Item />
        <Pagination.Item>
          <Pagination.Button aria-label="Side 10">10</Pagination.Button>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Button aria-label="Neste side">Neste</Pagination.Button>
        </Pagination.Item>
      </Pagination.List>
    </Pagination>
  );
}

export default function Items({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionId = getCollectionId(pathname);
  const limitParam = searchParams.get('limit');
  const limit = limitParam != null ? Number(limitParam) : undefined;
  const itemsUrl = useMemo(() => getItemsApiUrl(slug, searchParams), [slug, searchParams]);
  const { data: collection = null } = useSWR(getCollectionApiUrl(collectionId), fetcher);
  const { data: items = null } = useSWR(itemsUrl, fetcher);

  if (!collection || !items) return null;

  const total =
    items?.numberMatched ??
    items?.total ??
    (Array.isArray(items?.features) ? items.features.length : 0);

  const showSelect = total >= 20;

  function onLimitChange(e) {
    const v = e.target.value;
    const next = new URLSearchParams(searchParams.toString());
    if (v === 'all') next.delete('limit');
    else next.set('limit', v);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': 'Administrative enheter',
          '/collections': 'Collections',
          [`/collections/${collection.id}`]: collection.title,
          [`/collections/${collection.id}/items`]: 'Items',
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm" className={styles.heading}>
          {collection.title}
        </Heading>

        <Map featureCollection={items} className={styles.map} />

        <div className={styles.controls}>
          {showSelect && (
            <Field className={styles.selectNumbers}>
              <Label>Antall items pr side</Label>
              <Select
                size="sm"
                className={styles.viewSelect}
                value={limit ? String(limit) : 'all'}
                onChange={onLimitChange}
              >
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">Alle ({total})</option>
              </Select>
            </Field>
          )}
          {/* Dummy pager beholdt for design */}
          <Pager />
        </div>

        <DynamicFeatureTable items={items} limit={limit} />
      </div>
    </>
  );
}