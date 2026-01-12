"use client";

import { use, useEffect, useState } from "react";
import useSWR from "swr";
import { buildApiUrl, fetcher } from "./helpers";
import { Heading, Spinner } from "@digdir/designsystemet-react";
import { Breadcrumbs, ItemsTable, Map } from "@/components";
import FilterCard from "@/components/FilterCard";
import styles from "./page.module.css";

export default function Items({ params, searchParams }) {
  const { collection } = use(params);
  const _searchParams = use(searchParams);
  const apiUrl = buildApiUrl(collection, _searchParams);
  const {
    data: _data = null,
    isLoading,
    error,
  } = useSWR({ apiUrl, collection }, fetcher);

  if (error) {
    console.error("SWR Error:", error);
  }
  const [data, setData] = useState(null);

  useEffect(() => {
    if (_data !== null) {
      setData(_data);
    }
  }, [_data]);

  if (data === null) {
    if (isLoading) {
      return (
        <div style={{ padding: "2rem" }}>
          <Spinner aria-label="Laster data..." data-size="xl" />
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          "/": data.datasetTitle,
          "/collections": "Collections",
          [`/collections/${collection}`]: data.collection.title,
          [`/collections/${collection}/items`]: "Items",
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm" className={styles.heading}>
          {data.collection.title}
        </Heading>

        <div className={styles.content}>
          {isLoading && (
            <div className={styles.overlay}>
              <Spinner aria-label="Laster data..." data-size="xl" />
            </div>
          )}

          <div className={styles.top}>
            <div className={styles.topLeft}>
              <Map
                featureCollection={data}
                defaultExtent={data.collection.extent}
                width={567}
                height={675}
              />
            </div>

            <div className={styles.topRight}>
              <FilterCard data={data} />
            </div>
          </div>

          <div className={styles.bottom}>
            {data.features.length > 0 && <ItemsTable data={data} />}
          </div>
        </div>
      </div>
    </>
  );
}
