"use client";

import { useEffect, useMemo, useState } from "react";
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
import styles from "./DeveloperCard.module.css";
import NextLink from "next/link";
import { getApiBaseUrl } from "@/config/apiConfig";

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
  const [copied, setCopied] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const url = await getApiBaseUrl();
      if (!cancelled) {
        setApiBaseUrl(prev => prev === (url ?? "") ? prev : (url ?? ""));
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const links = useMemo(
    () => {
      if (!apiBaseUrl) {
        return {
          root: "",
          swagger: "",
          openapi: "",
          conformance: ""
        };
      }

      return {
        root: apiBaseUrl,
        swagger: `${apiBaseUrl}/openapi?f=html`,
        openapi: `${apiBaseUrl}/openapi?f=json`,
        conformance: `${apiBaseUrl}/conformance?f=html`
      };
    },
    [apiBaseUrl]
  );

  async function copyUrl() {
    if (!links.root) {
      return;
    }

    await navigator.clipboard.writeText(links.root);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <DeveloperCardWrapper>
      <div className={styles.urlCopy}>
        <div className={styles.url}>{links.root}</div>
        <button
          type="button"
          onClick={copyUrl}
          aria-label="Kopier URL"
          className={styles.copyButton}
          disabled={!links.root}
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
          <NextLink href={links.swagger} target="_blank">
            Swagger UI
            <ArrowRightIcon title="a11y-title" fontSize="28px" />
          </NextLink>
        </Link>
        <Link asChild></Link>
        <Link asChild>
          <NextLink href={links.openapi} target="_blank">
            OpenAPI Document
            <ArrowRightIcon title="a11y-title" fontSize="28px" />
          </NextLink>
        </Link>
        <Link asChild>
          <NextLink href={links.conformance} target="_blank">
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
