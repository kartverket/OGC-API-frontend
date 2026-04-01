"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createMapImage } from "@/utils/map/mapImage";

export default function MapImage({ featureCollection, options }) {
  const [image, setImage] = useState(null);
  const initRef = useRef(true);
  const width = options?.width ?? 640;
  const height = options?.height ?? 480;

  useEffect(() => {
    if (!initRef.current) {
      return;
    }

    initRef.current = false;

    (async () => {
      const base64 = await createMapImage(featureCollection, options);
      setImage(base64);
    })();
  }, [featureCollection, options]);

  return (
    image !== null && (
      <Image src={image} alt="Kart" width={width} height={height} unoptimized />
    )
  );
}
