import { fetchCollectionsPageData } from "@/services/pageData";
import { createCollectionsMetadata } from "@/services/pageMetadata";
import { Heading } from "@digdir/designsystemet-react";
import { Breadcrumbs, CollectionCard, ErrorPage } from "@/components";
import styles from "./page.module.css";

export const generateMetadata = async () => createCollectionsMetadata();

export default async function Collections() {
  const { data, status } = await fetchCollectionsPageData();

  if (status !== 200) {
    return <ErrorPage status={status} />;
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          "/": data.dataset.title,
          "/collections": "Collections",
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm" className={styles.heading}>
          Innhold i datasettet
        </Heading>

        <div className={styles.collections}>
          {data.collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </>
  );
}
