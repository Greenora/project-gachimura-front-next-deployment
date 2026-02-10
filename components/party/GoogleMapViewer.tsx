// components/party/GoogleMapViewer.tsx
"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import React from "react";

interface GoogleMapViewerProps {
  lat: number;
  lng: number;
  height?: string; // 높이를 props로 받기
}

export default function GoogleMapViewer({ lat, lng, height = "250px" }: GoogleMapViewerProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || "",
  });

  const containerStyle = {
    width: "100%",
    height: height,
    borderRadius: "12px",
  };

  const center = { lat, lng };

  if (!isLoaded) return <div className={`w-full bg-gray-100 rounded-xl animate-pulse`} style={{ height }} />;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={16}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      <Marker position={center} />
    </GoogleMap>
  );
}