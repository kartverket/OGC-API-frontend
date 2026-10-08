import { Button, Card, Heading, Link, Paragraph } from '@digdir/designsystemet-react';
import NextLink from 'next/link';
import { Breadcrumbs, ErrorPage } from '@/components';
import { fetchStylesPageData } from '@/services/pageData';
import { createStylesMetadata } from '@/services/pageMetadata';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collection } = await params;
  return createStylesMetadata(collection);
}

function localizedText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  return value['nb-NO'] ?? value['en-US'] ?? Object.values(value).find((entry) => typeof entry === 'string') ?? null;
}

function formatMediaType(mediaType) {
  if (mediaType?.toLowerCase() === 'application/vnd.mapbox.style+json') {
    return 'Mapbox Style JSON';
  }

  return mediaType || 'Ukjent format';
}

export default async function CollectionStyles({ params }) {
  const { collection } = await params;
  const { data, status } = await fetchStylesPageData(collection);

  if (status !== 200) {
    return <ErrorPage status={status} />;
  }

  const availableStyles = Array.isArray(data.styles) ? data.styles : [];

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': data.dataset.title,
          '/collections': 'Collections',
          [`/collections/${data.collection.id}`]: data.collection.title,
          [`/collections/${data.collection.id}/styles`]: 'Stiler',
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm" className={styles.heading}>
          Stiler for {data.collection.title}
        </Heading>

        {availableStyles.length === 0 ? (
          <Paragraph>Ingen stiler er tilgjengelige for denne collectionen.</Paragraph>
        ) : (
          <div className={styles.styleList}>
            {availableStyles.map((style) => {
              const title = localizedText(style.title) || style.id;
              const description = localizedText(style.description);
              const stylesheetLinks = (style.links ?? []).filter((link) => link.rel === 'stylesheet' && link.href);

              return (
                <Card key={style.id} className={styles.styleCard}>
                  <div className={styles.cardHeading}>
                    <Heading level={2} data-size="xs">
                      {title}
                    </Heading>
                  </div>

                  <dl className={styles.metadata}>
                    <div>
                      <dt>Style-ID:</dt>
                      <dd>{style.id}</dd>
                    </div>
                  </dl>

                  {description && <Paragraph>{description}</Paragraph>}

                  <Button asChild data-size="sm" className={styles.viewTiles}>
                    <NextLink
                      href={`/collections/${encodeURIComponent(collection)}/tiles?style=${encodeURIComponent(style.id)}`}
                    >
                      Vis i fliskart
                    </NextLink>
                  </Button>

                  <span className={styles.metadataLink} aria-disabled="true">
                    Vis metadata (kommer senere)
                  </span>

                  {stylesheetLinks.length > 0 && (
                    <div className={styles.formats}>
                      <Heading level={3} data-size="2xs">
                        Tilgjengelige formater
                      </Heading>
                      <ul>
                        {stylesheetLinks.map((link) => (
                          <li key={`${link.type ?? 'unknown'}-${link.href}`}>
                            <Link href={link.href} target="_blank" rel="noreferrer">
                              {formatMediaType(link.type)}
                            </Link>
                            <span className={styles.mediaType}>{link.type || 'Ukjent media type'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
