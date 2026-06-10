import {
  fetchHome,
  fetchCollections,
  fetchCollection,
  fetchItem,
  fetchQueryables
} from '@/utils/api/server';
import { createErrorResponse } from '@/utils/api/utils';
import { getMetadata, getCollectionDownloadConfig, getCollectionFeatureIdField, getCollectionFeatureTitleField } from '@/config/readPygeoapiConfig';

/**
 * Fetches data for the home page.
 * @returns {Promise<{data: Object, status: number}>}
 */
export async function fetchHomePageData() {
  try {
    const [homeData, collectionsData] = await Promise.all([
      fetchHome(),
      fetchCollections()
    ]);

    return {
      data: {
        ...homeData,
        collectionCount: collectionsData.collections.length,
        metadata: getMetadata()
      },
      status: 200
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Fetches data for the collections listing page.
 * @returns {Promise<{data: Object, status: number}>}
 */
export async function fetchCollectionsPageData() {
  try {
    const [collectionsData, homeData] = await Promise.all([
      fetchCollections(),
      fetchHome()
    ]);

    return {
      data: {
        ...collectionsData,
        dataset: { title: homeData.title }
      },
      status: 200
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Fetches data for a single collection page.
 * @param {string} collection - The collection name
 * @returns {Promise<{data: Object, status: number}>}
 */
export async function fetchCollectionPageData(collection) {
  try {
    const [collectionData, homeData] = await Promise.all([
      fetchCollection(collection),
      fetchHome()
    ]);

    return {
      data: {
        ...collectionData,
        dataset: { title: homeData.title },
        metadata: getMetadata(),
        downloadConfig: getCollectionDownloadConfig(collection)
      },
      status: 200
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Fetches data for the items listing page.
 * @param {string} collection - The collection name
 * @returns {Promise<{data: Object, status: number}>}
 */
export async function fetchItemsPageData(collection) {
  try {
    const [queryables, collectionData, homeData] = await Promise.all([
      fetchQueryables(collection),
      fetchCollection(collection),
      fetchHome()
    ]);

    return {
      data: {
        queryables,
        collection: {
          title: collectionData.title,
          extent: {
            bbox: collectionData.extent.spatial.bbox[0],
            crs: collectionData.extent.spatial.crs
          }
        },
        dataset: { title: homeData.title },
        idField: getCollectionFeatureIdField(collection)
      },
      status: 200
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Fetches data for a single item page.
 * @param {string} collection - The collection name
 * @param {string} itemId - The item ID
 * @returns {Promise<{data: Object, status: number}>}
 */
export async function fetchItemPageData(collection, itemId) {
  try {
    const [itemData, collectionData, homeData] = await Promise.all([
      fetchItem(collection, itemId),
      fetchCollection(collection),
      fetchHome()
    ]);

    return {
      data: {
        ...itemData,
        collection: { title: collectionData.title },
        dataset: { title: homeData.title },
        idField: getCollectionFeatureIdField(collection),
        titleField: getCollectionFeatureTitleField(collection)
      },
      status: 200
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Fetches data for the queryables page.
 * @param {string} collection - The collection name
 * @returns {Promise<{data: Object, status: number}>}
 */
export async function fetchQueryablesPageData(collection) {
  try {
    const [queryablesData, collectionData, homeData] = await Promise.all([
      fetchQueryables(collection),
      fetchCollection(collection),
      fetchHome()
    ]);

    return {
      data: {
        ...queryablesData,
        collection: { title: collectionData.title },
        dataset: { title: homeData.title }
      },
      status: 200
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}
