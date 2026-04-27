import { fetchHome, fetchCollection } from '@/utils/api/server';

const SITE_SUFFIX = 'OGC API | Kartverket';

/**
 * Creates metadata for the home page.
 * @returns {Promise<{title: string}|null>}
 */
export async function createHomeMetadata() {
  try {
    const homeData = await fetchHome();
    return { title: `${homeData.title} | ${SITE_SUFFIX}` };
  } catch {
    return null;
  }
}

/**
 * Creates metadata for the collections page.
 * @returns {Promise<{title: string}|null>}
 */
export async function createCollectionsMetadata() {
  try {
    const homeData = await fetchHome();
    return { title: `Collections | ${homeData.title} | ${SITE_SUFFIX}` };
  } catch {
    return null;
  }
}

/**
 * Creates metadata for a single collection page.
 * @param {string} collection - The collection name
 * @returns {Promise<{title: string}|null>}
 */
export async function createCollectionMetadata(collection) {
  try {
    const [collectionData, homeData] = await Promise.all([
      fetchCollection(collection),
      fetchHome()
    ]);
    return {
      title: `${collectionData.title} | Collections | ${homeData.title} | ${SITE_SUFFIX}`
    };
  } catch {
    return null;
  }
}

/**
 * Creates metadata for the items page.
 * @param {string} collection - The collection name
 * @returns {Promise<{title: string}|null>}
 */
export async function createItemsMetadata(collection) {
  try {
    const [collectionData, homeData] = await Promise.all([
      fetchCollection(collection),
      fetchHome()
    ]);
    return {
      title: `Items | ${collectionData.title} | Collections | ${homeData.title} | ${SITE_SUFFIX}`
    };
  } catch {
    return null;
  }
}

/**
 * Creates metadata for a single item page.
 * @param {string} collection - The collection name
 * @param {string} itemId - The item ID
 * @returns {Promise<{title: string}|null>}
 */
export async function createItemMetadata(collection, itemId) {
  try {
    const [collectionData, homeData] = await Promise.all([
      fetchCollection(collection),
      fetchHome()
    ]);
    return {
      title: `${itemId} | Items | ${collectionData.title} | Collections | ${homeData.title} | ${SITE_SUFFIX}`
    };
  } catch {
    return null;
  }
}

/**
 * Creates metadata for the queryables page.
 * @param {string} collection - The collection name
 * @returns {Promise<{title: string}|null>}
 */
export async function createQueryablesMetadata(collection) {
  try {
    const [collectionData, homeData] = await Promise.all([
      fetchCollection(collection),
      fetchHome()
    ]);
    return {
      title: `Queryables | ${collectionData.title} | Collections | ${homeData.title} | ${SITE_SUFFIX}`
    };
  } catch {
    return null;
  }
}

export async function createSchemaMetadata(collection) {
  try {
    const [collectionData, homeData] = await Promise.all([
      fetchCollection(collection),
      fetchHome()
    ]);
    return {
      title: `Skjema | ${collectionData.title} | Collections | ${homeData.title} | ${SITE_SUFFIX}`
    };
  } catch {
    return null;
  }
}
