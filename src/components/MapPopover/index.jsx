'use client';

import { Button, Link } from '@digdir/designsystemet-react';
import { ArrowRightIcon, ZoomPlusIcon } from '@navikt/aksel-icons';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Popover } from '@/components';
import { useItemsMap } from '@/context/ItemsMapProvider';
import { selectFeature } from '@/store/slices/mapSlice';
import { zoomToFeature } from '@/utils/map/helpers';
import styles from './MapPopover.module.css';

export default function MapPopover() {
  const { collection } = useParams();
  const map = useItemsMap();
  const feature = useSelector((state) => state.map.selectedFeature);
  const dispatch = useDispatch();

  function getItemUrl(id) {
    return `/collections/${collection}/items/${id}`;
  }

  function unselectFeature() {
    dispatch(selectFeature(null));
  }

  function zoomToItem(id) {
    zoomToFeature(map, id);
  }

  const { style, content } = useMemo(() => {
    if (feature === null) {
      return {
        style: null,
        content: null,
      };
    }

    return {
      style: {
        display: 'block',
        position: 'absolute',
        left: `${feature.pixel[0]}px`,
        top: `${feature.pixel[1] - 8}px`,
        transform: 'translate(-50%, -100%)',
      },
      content: (
        <div className={styles.popoverContent}>
          <Link asChild className={styles.link}>
            <NextLink href={getItemUrl(feature.id)} onClick={unselectFeature}>
              Item {feature.id}
              <ArrowRightIcon fontSize="1.5rem" />
            </NextLink>
          </Link>

          <Button
            onClick={() => zoomToItem(feature.id)}
            icon
            variant="tertiary"
            title={`Zoom til item ${feature.id}`}
            aria-label="Zoom til item"
            data-size="sm"
          >
            <ZoomPlusIcon aria-hidden fontSize="1.5rem" />
          </Button>
        </div>
      ),
    };
  }, [feature]);

  return <Popover style={style}>{content}</Popover>;
}
