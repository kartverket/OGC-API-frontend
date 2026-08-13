"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
    Card,
    CardBlock,
    Divider,
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
import { useBaseUrlSWR } from "@/config/apiConfig.swr";

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
    const { baseUrl } = useBaseUrlSWR();

    const links = useMemo(
        () => {
            if (!baseUrl) {
                return {
                    root: "",
                    swagger: "",
                    openapi: "",
                    conformance: "",
                    tileMatrixSets: ""
                };
            }

            return {
                root: baseUrl,
                swagger: `/openapi?f=html`,
                openapi: `/openapi?f=json`,
                conformance: `/conformance?f=json`,
                tileMatrixSets: `/TileMatrixSets?f=json`,
            };
        },
        [baseUrl]
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
            <div className={styles.usage}>
                <span>Bruk i QGIS/ArcGIS</span>

                <span className={styles.divider}></span>

                <Link
                    href="https://kartverket.github.io/ogcapi-docs/docs/bruk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                >
                    Se mer info
                </Link>
            </div>

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

            <Divider />

            <div className={styles.links}>
                <Link asChild className={styles.link}>
                    <NextLink href={links.swagger} target="_blank">
                        Swagger UI
                        <ArrowRightIcon title="a11y-title" fontSize="28px" />
                    </NextLink>
                </Link>
                <Link asChild className={styles.link}>
                    <NextLink href={links.openapi} target="_blank">
                        OpenAPI Document
                        <ArrowRightIcon title="a11y-title" fontSize="28px" />
                    </NextLink>
                </Link>
                <Link asChild className={styles.link}>
                    <NextLink href={links.conformance} target="_blank">
                        Conformance
                        <ArrowRightIcon title="a11y-title" fontSize="28px" />
                    </NextLink>
                </Link>
                <Link asChild className={styles.link}>
                    <NextLink href={links.tileMatrixSets} target="_blank">
                        Tile Matrix Sets
                        <ArrowRightIcon title="a11y-title" fontSize="28px" />
                    </NextLink>
                </Link>
            </div>
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
