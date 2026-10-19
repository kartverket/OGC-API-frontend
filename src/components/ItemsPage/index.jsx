'use client';

import { Alert, Card, Field, Heading, Label, Link, Paragraph, Select, Spinner } from '@digdir/designsystemet-react';
import { PaletteFillIcon } from '@navikt/aksel-icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWRImmutable from 'swr/immutable';
import { Breadcrumbs, ErrorPage, FilterCard, ItemsMap, ItemsTable } from '@/components';
import ItemsMapProvider from '@/context/ItemsMapProvider';
import ItemsProvider from '@/context/ItemsProvider';
import { fetchItems } from '@/utils/api/client';
import { getResponse } from '@/utils/api/utils';
import { getGeoJsonStyleSourceId } from '@/utils/map/featuresLayer';
import styles from './ItemsPage.module.css';

async function fetchItemsStyles([collection]) {
  const styleList = await getResponse(await fetch(`/collections/${encodeURIComponent(collection)}/styles?f=json`));
  if (!Array.isArray(styleList.styles)) {
    throw new Error('Ugyldig stilliste.');
  }

  async function fetchStyle(style) {
    const stylesheet = style.links?.find((link) => link.rel === 'stylesheet' && link.href);
    if (!stylesheet) {
      throw new Error(`Mangler stil-lenke for ${style.id}.`);
    }

    const document = await getResponse(await fetch(stylesheet.href));
    if (document?.version !== 8 || !document.sources || !Array.isArray(document.layers)) {
      throw new Error(`Ugyldig stildokument for ${style.id}.`);
    }
    return document;
  }

  const results = await Promise.allSettled(styleList.styles.map(fetchStyle));
  const failed = results.filter((result) => result.status === 'rejected');
  for (const result of failed) console.error('Kunne ikke laste stil:', result.reason);
  const styles = styleList.styles
    .map((style, index) => ({ style, result: results[index] }))
    .filter(({ result }) => result.status === 'fulfilled' && getGeoJsonStyleSourceId(result.value, collection))
    .map(({ style, result }) => ({ ...style, document: result.value }));

  if (styles.length === 0 && failed.length > 0) {
    throw new Error('Kunne ikke finne en GeoJSON-stil; ett eller flere stilark kunne ikke lastes.');
  }

  return {
    styles,
    defaultId: styleList.default,
    styleIds: styleList.styles.map((style) => style.id),
    failedIds: styleList.styles.filter((_, index) => results[index].status === 'rejected').map((style) => style.id),
    warning: failed.length > 0 ? 'Enkelte stiler kunne ikke lastes.' : null,
  };
}

export default function Items({ srvData, collection, searchParams }) {
  const [applyStyleError, setApplyStyleError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const { style: styleId, ...itemParams } = searchParams;
  const searchKey = new URLSearchParams(itemParams).toString();

  const apiUrl = useMemo(() => {
    const base = `/collections/${collection}/items?f=json`;
    return searchKey ? `${base}&${searchKey}` : base;
  }, [collection, searchKey]);

  const {
    data: _data = null,
    error = null,
    isLoading,
  } = useSWRImmutable(apiUrl, fetchItems, { refreshInterval: 0, keepPreviousData: true });

  const {
    data: availableStyles,
    error: styleError,
    isLoading: isStyleLoading,
  } = useSWRImmutable([collection], fetchItemsStyles);

  const stylesForItems = availableStyles?.styles ?? [];
  const selectedStyle =
    styleId === undefined
      ? (stylesForItems.find((style) => style.id === availableStyles?.defaultId) ?? stylesForItems[0])
      : stylesForItems.find((style) => style.id === styleId);
  let selectionError = null;
  if (availableStyles && styleId !== undefined && !selectedStyle) {
    selectionError =
      typeof styleId !== 'string' || !styleId.trim()
        ? 'Ugyldig stil-ID.'
        : availableStyles.failedIds.includes(styleId)
          ? `Kunne ikke laste stilen ${styleId}.`
          : availableStyles.styleIds.includes(styleId)
            ? `Stilen ${styleId} har ingen GeoJSON-kilde for ${collection}.`
            : `Ukjent stil: ${styleId}`;
  }

  function handleStyleChange(event) {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.set('style', event.target.value);
    router.push(`${pathname}?${params}`, { scroll: false });
  }

  const data = useMemo(() => {
    if (_data === null) {
      return null;
    }

    return {
      ..._data,
      ...srvData,
    };
  }, [_data, srvData]);

  if (error !== null) {
    return <ErrorPage status={error.status.code} />;
  }

  if (data === null) {
    return null;
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': data.dataset.title,
          '/collections': 'Collections',
          [`/collections/${collection}`]: data.collection.title,
          [`/collections/${collection}/items`]: 'Items',
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm" className={styles.heading}>
          {data.collection.title}
        </Heading>
        <div className={styles.content}>
          {isStyleLoading && <Paragraph>Laster valgt stil...</Paragraph>}
          {styleError && <Alert data-color="danger">Kunne ikke laste valgt stil: {styleError.message}</Alert>}
          {applyStyleError && <Alert data-color="danger">Kunne ikke bruke valgt stil: {applyStyleError}</Alert>}
          {isLoading && (
            <div className={styles.overlay}>
              <Spinner aria-label="Laster data..." data-size="xl" />
              <Paragraph>Laster data...</Paragraph>
            </div>
          )}

          <ItemsProvider data={data}>
            <div className={styles.top}>
              <ItemsMapProvider
                data={data}
                featureCollection={_data}
                styleDocument={selectedStyle?.document}
                collectionId={collection}
                onStyleError={setApplyStyleError}
              >
                <div className={styles.topLeft}>
                  <ItemsMap width={567} height={675} />
                </div>

                <div className={styles.topRight}>
                  <FilterCard data={data} />
                  {(availableStyles || selectionError) && (
                    <Card className={styles.styleCard}>
                      <div className={styles.styleHeading}>
                        <PaletteFillIcon aria-hidden fontSize="24px" />
                        <Heading level={2} data-size="sm">
                          Stil
                        </Heading>
                      </div>
                      {stylesForItems.length > 0 && (
                        <Field>
                          <Label htmlFor="items-style">Velg stil</Label>
                          <Select id="items-style" value={selectedStyle?.id ?? ''} onChange={handleStyleChange}>
                            {!selectedStyle && (
                              <Select.Option value="" disabled>
                                Velg stil
                              </Select.Option>
                            )}
                            {stylesForItems.map((style) => (
                              <Select.Option key={style.id} value={style.id}>
                                {style.title || style.id}
                              </Select.Option>
                            ))}
                          </Select>
                        </Field>
                      )}
                      {availableStyles?.warning && <Alert data-color="warning">{availableStyles.warning}</Alert>}
                      {selectionError && <Alert data-color="danger">{selectionError}</Alert>}
                      {stylesForItems.length === 0 && (
                        <Paragraph>
                          Ingen items-stiler er tilgjengelige. Kartet bruker den innebygde standardstilen.
                        </Paragraph>
                      )}
                      {stylesForItems.length > 0 && (
                        <Link href={`/collections/${encodeURIComponent(collection)}/styles`}>Se stiler</Link>
                      )}
                    </Card>
                  )}
                </div>
              </ItemsMapProvider>
            </div>

            <div className={styles.bottom}>{data.features.length > 0 && <ItemsTable data={data} />}</div>
          </ItemsProvider>
        </div>
      </div>
    </>
  );
}
