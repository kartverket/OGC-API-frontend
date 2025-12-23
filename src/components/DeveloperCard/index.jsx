"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardBlock,
  Heading,
  Link,
  Skeleton,
} from "@digdir/designsystemet-react";
import {
  ArrowRightIcon,
  TerminalIcon,
  CheckmarkIcon,
} from "@navikt/aksel-icons";
import CopyIcon from "@/assets/gfx/icon-copy.svg";
import styles from "./DeveloperCard.module.scss";
import NextLink from "next/link";
import { buildApiUrl } from "@/config/apiConfig";

function DeveloperCardWrapper({ children }) {
  return (
    <Card className={styles.developerCard}>
      <CardBlock className={styles.cardBlock}>
        <div className={styles.heading}>
          <TerminalIcon title="a11y-title" fontSize="24px" />
          <Heading data-size="2xs">Ta i bruk datasettet</Heading>
        </div>
        {children}
      </CardBlock>
    </Card>
  );
}

function DeveloperCard() {
  const origin = window.location.origin;
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(origin);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <DeveloperCardWrapper>
      <div className={styles.urlCopy}>
        <div className={styles.url}>{origin}</div>
        <button
          type="button"
          onClick={copyUrl}
          aria-label="Kopier URL"
          className={styles.copyButton}
        >
          {copied ? (
            <CheckmarkIcon title="Kopiert!" width="28px" height="28px" />
          ) : (
            <CopyIcon title="a11y-title" width="28px" />
          )}
        </button>
      </div>

      <div className={styles.links}>
        <Link asChild>
          <NextLink href={buildApiUrl("/openapi?f=html")} target="_blank">
            Swagger UI
            <ArrowRightIcon title="a11y-title" fontSize="28px" />
          </NextLink>
        </Link>
        <Link asChild></Link>
        <Link asChild>
          <NextLink href={buildApiUrl("/openapi?f=json")} target="_blank">
            OpenAPI Document
            <ArrowRightIcon title="a11y-title" fontSize="28px" />
          </NextLink>
        </Link>
        <Link asChild>
          <NextLink href={buildApiUrl("/conformance?f=html")} target="_blank">
            Conformance
            <ArrowRightIcon title="a11y-title" fontSize="28px" />
          </NextLink>
        </Link>
      </div>

      {/* <Divider />

      <div className={styles.downloadButtons}>
        <div className={styles.text}>Last ned datasett</div>

        <div className={styles.buttonRow}>
          <Button variant="secondary" data-size="sm">
            <DownloadIcon aria-hidden fontSize="1.5rem" />
            GeoJSON
          </Button>

          <Button variant="secondary" data-size="sm">
            <DownloadIcon aria-hidden fontSize="1.5rem" />
            GPKG
          </Button>

          <Button variant="secondary" data-size="sm">
            <DownloadIcon aria-hidden fontSize="1.5rem" />
            GML
          </Button>
        </div>
      </div> */}
    </DeveloperCardWrapper>
  );
}

function LoadingSkeleton() {
  return (
    <DeveloperCardWrapper>
      <div className={styles.urlCopy}>
        <Skeleton />
      </div>
      <Skeleton />
      <div className={styles.links}>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </DeveloperCardWrapper>
  );
}

export default dynamic(() => Promise.resolve(DeveloperCard), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});
