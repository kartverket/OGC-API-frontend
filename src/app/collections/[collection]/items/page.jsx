import { fetchItemsPageData } from "@/services/pageData";
import { createItemsMetadata } from "@/services/pageMetadata";
import { ErrorPage, ItemsPage } from "@/components";
import { getCollectionFeatureIdField } from "@/config/readPygeoapiConfig";

export async function generateMetadata({ params }) {
  const { collection } = await params;
  return createItemsMetadata(collection);
}

export default async function Items({ params, searchParams }) {
  const { collection } = await params;
  const _searchParams = await searchParams;
  const { data, status } = await fetchItemsPageData(collection);

  if (status !== 200) {
    return <ErrorPage status={status} />;
  }

  const idField = getCollectionFeatureIdField(collection);

  return (
    <ItemsPage
      srvData={data}
      collection={collection}
      searchParams={_searchParams}
      idField={idField}
    />
  );
}
