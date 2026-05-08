import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { MapPin, Box, Info } from 'lucide-react';
import { Shipment } from '../types';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MarkerProps {
  shipment: Shipment;
  key?: string;
}

function ShipmentMarker({ shipment }: MarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  if (!shipment.currentLat || !shipment.currentLng) return null;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: shipment.currentLat, lng: shipment.currentLng }}
        onClick={() => setOpen(true)}
      >
        <div className="relative group">
          <Pin 
            background={shipment.status === 'DELAYED' ? '#ef4444' : '#2563eb'} 
            glyphColor="#fff" 
            borderColor="#fff"
          />
          <div className="absolute top-0 left-full ml-2 px-2 py-1 bg-white border border-gray-100 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            <p className="text-[10px] font-bold text-gray-900">{shipment.trackingNumber}</p>
          </div>
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setOpen(false)}
        >
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{shipment.trackingNumber}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                shipment.status === 'DELAYED' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {shipment.status}
              </span>
            </div>
            <h4 className="font-bold text-sm text-gray-900 mb-2">Active Logistics Node</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{shipment.origin} → {shipment.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <Box className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">Assigned: {shipment.assignedDriverId || 'Autonomous'}</span>
              </div>
            </div>
            <button className="w-full mt-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-gray-800 transition-colors">
              Full Telemetry
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface LogisticsMapProps {
  shipments: Shipment[];
}

export default function LogisticsMap({ shipments }: LogisticsMapProps) {
  if (!hasValidKey) {
    return (
      <div className="technical-card h-full flex items-center justify-center bg-gray-50/50 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative text-center max-w-sm p-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100 shadow-inner">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Map Intelligence Offline</h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Connect your <span className="font-bold text-gray-900">Google Maps Platform</span> key to activate real-time fleet visualization and route optimization.
          </p>
          
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-left shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Setup Instructions</span>
            </div>
            <ul className="space-y-2 text-[10px] text-gray-600 font-medium list-decimal list-inside">
              <li>Get key from <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className="text-blue-600 underline">Cloud Console</a></li>
              <li>Open Settings (⚙️) → Secrets</li>
              <li>Add <code className="bg-gray-100 px-1 rounded">GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ul>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-gray-100" />
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Preview Mode</span>
                <div className="h-[1px] flex-1 bg-gray-100" />
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                {shipments.slice(0, 2).map((s) => (
                  <div key={s.id} className="text-left p-3 rounded-lg bg-white border border-gray-100 shadow-sm opacity-50">
                    <p className="text-[10px] font-bold text-gray-900 mb-1">{s.trackingNumber}</p>
                    <div className="flex items-center gap-1 text-[8px] text-gray-400 uppercase font-black">
                       <span>{s.status}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="technical-card h-full p-0 overflow-hidden relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{ lat: 39.8283, lng: -98.5795 }} // Center of US
          defaultZoom={4}
          mapId="SWIFTCONNECT_FLEET_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          disableDefaultUI={true}
          gestureHandling="greedy"
        >
          {shipments.map((s) => (
            <ShipmentMarker key={s.id} shipment={s} />
          ))}
        </Map>
      </APIProvider>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-lg p-3 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
             <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Live Fleet Activity</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Units</p>
                <p className="text-sm font-black text-blue-600">{shipments.filter(s => s.status === 'IN_TRANSIT').length}</p>
             </div>
             <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Critical Delays</p>
                <p className="text-sm font-black text-red-500">{shipments.filter(s => s.status === 'DELAYED').length}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
