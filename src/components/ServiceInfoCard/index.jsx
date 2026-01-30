"use client";

import { useState } from "react";
import { Card, CardBlock, Heading, Link } from "@digdir/designsystemet-react";
import { Details, DetailsContent, DetailsSummary } from "..";
import { InformationSquareIcon } from "@navikt/aksel-icons";
import styles from "./ServiceInfoCard.module.css";

const MAX_VISIBLE_KEYWORDS = 4;

export default function ServiceInfoCard({ metadata }) {
  const [keywordsExpanded, setKeywordsExpanded] = useState(false);

  const keywords = metadata?.identification?.keywords?.en || [];
  const hasMoreKeywords = keywords.length > MAX_VISIBLE_KEYWORDS;
  const visibleKeywords = keywordsExpanded
    ? keywords
    : keywords.slice(0, MAX_VISIBLE_KEYWORDS);
  const hiddenCount = keywords.length - MAX_VISIBLE_KEYWORDS;

  return (
    <Card className={styles.serviceInfoCard}>
      <CardBlock className={styles.cardBlock}>
        <div className={styles.heading}>
          <InformationSquareIcon title="a11y-title" fontSize="24px" />
          <Heading data-size="2xs">Info om datasettet</Heading>
        </div>

        <div className={styles.info}>
          <div>
            <div className={styles.label}>Tilbyder</div>
            <div className={styles.value}>
              {metadata?.provider?.name || "Kartverket"}
            </div>
          </div>
          <div>
            <div className={styles.label}>Lisens</div>
            <div className={styles.value}>
              <Link
                href={
                  metadata?.license?.url ||
                  "https://creativecommons.org/licenses/by/4.0"
                }
                target="_blank"
              >
                {metadata?.license?.name || "CC-BY 4.0 License"}
              </Link>
            </div>
          </div>
          {keywords.length > 0 && (
            <div className={styles.keywordsRow}>
              <div className={styles.label}>Nøkkelord</div>
              <div className={styles.keywords}>
                {visibleKeywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
                {hasMoreKeywords && !keywordsExpanded && (
                  <button
                    type="button"
                    className={styles.moreButton}
                    onClick={() => setKeywordsExpanded(true)}
                  >
                    +{hiddenCount} til
                  </button>
                )}
                {keywordsExpanded && (
                  <button
                    type="button"
                    className={styles.moreButton}
                    onClick={() => setKeywordsExpanded(false)}
                  >
                    Vis mindre
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={styles.contactInfo}>
          <br />
          <Card>
            <Details role="group">
              <DetailsSummary
                aria-expanded="false"
                role="button"
                slot="summary"
                tabindex="0"
              >
                Kontaktinfo
              </DetailsSummary>
              <DetailsContent>
                <div className={styles.details}>
                  <div>
                    <div className={styles.label}>URL</div>
                    <div className={styles.value}>
                      <Link
                        href={
                          metadata?.contact?.url || "https://www.kartverket.no"
                        }
                      >
                        {metadata?.contact?.url || "https://www.kartverket.no"}
                      </Link>
                    </div>
                  </div>
                  <div>
                    <div className={styles.label}>E-post</div>
                    <div className={styles.value}>
                      <Link
                        href={`mailto:${metadata?.contact?.email || "post@kartverket.no"}`}
                      >
                        {metadata?.contact?.email || "post@kartverket.no"}
                      </Link>
                    </div>
                  </div>
                  <div>
                    <div className={styles.label}>Kontakt-URL</div>
                    <div className={styles.value}>
                      <Link
                        href={
                          metadata?.contact?.contactUrl ||
                          "https://www.kartverket.no/om-kartverket/kontakt-oss"
                        }
                      >
                        {metadata?.contact?.contactUrl ||
                          "https://www.kartverket.no/om-kartverket/kontakt-oss"}
                      </Link>
                    </div>
                  </div>
                </div>
              </DetailsContent>
            </Details>
          </Card>
        </div>
      </CardBlock>
    </Card>
  );
}
