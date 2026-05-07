import React, { useState, useMemo } from 'react';
import { useShipments } from '../hooks/useShipments';
import { StatusBadge } from '../components/Badges';
import { 
  Search, Filter, MoreHorizontal, MapPin, 
  Calendar, Clock, ChevronUp, ChevronDown,
  CheckCircle, Truck, AlertCircle, UserPlus,
  History, ArrowRight, Download, Check, X,
  ChevronRight, Plus, Map as MapIcon, List,
  CalendarDays
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Shipment, ShipmentStatus } from '../types';
import Modal from '../components/Modal';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

type SortConfig = { key: keyof Shipment | 'eta' | 'driver'; direction: 'asc' | 'desc' } | null;

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const ShipmentMarker: React.FC<{ shipment: Shipment; onClick: () => void }> = ({ shipment, onClick }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [showInfo, setShowInfo] = useState(false);

  if (!shipment.currentLat || !shipment.currentLng) return null;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: shipment.currentLat, lng: shipment.currentLng }}
        onClick={() => {
          setShowInfo(true);
          onClick();
        }}
      >
        <Pin 
          background={shipment.status === 'DELAYED' ? '#ef4444' : shipment.status === 'IN_TRANSIT' ? '#3b82f6' : '#10b981'} 
          glyphColor="#fff" 
          borderColor="#fff"
        />
      </AdvancedMarker>
      {showInfo && (
        <InfoWindow anchor={marker} onCloseClick={() => setShowInfo(false)}>
          <div className="p-1 min-w-[150px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Tracking #</p>
            <p className="text-xs font-bold text-gray-900 mb-2">{shipment.trackingNumber}</p>
            <StatusBadge status={shipment.status} />
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default function Shipments() {
  const { shipments, loading, updateStatus, assignDriver, updateLocation, bulkUpdateStatus, addShipment, drivers } = useShipments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [destinationFilter, setDestinationFilter] = useState<string>('ALL');
  const [driverFilter, setDriverFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedShipmentIds, setExpandedShipmentIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string, field: 'origin' | 'destination', value: string } | null>(null);
  const [assignConfirmation, setAssignConfirmation] = useState<{
    shipmentId: string;
    driverId: string;
    driverName: string;
    trackingNumber: string;
  } | null>(null);

  const handleSort = (key: keyof Shipment | 'eta' | 'driver') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
  const [newShipment, setNewShipment] = useState({
    origin: '',
    destination: '',
    estimatedDelivery: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    trackingNumber: ''
  });

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    await (addShipment as any)(newShipment);
    setIsNewShipmentModalOpen(false);
    setNewShipment({
      origin: '',
      destination: '',
      estimatedDelivery: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      trackingNumber: ''
    });
  };

  const { origins, destinations } = useMemo(() => {
    const orgs = new Set(shipments.map(s => s.origin));
    const dests = new Set(shipments.map(s => s.destination));
    return {
      origins: Array.from(orgs).sort(),
      destinations: Array.from(dests).sort()
    };
  }, [shipments]);

  const filtered = shipments
    .filter(s => {
      const matchesSearch = s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.destination.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesOrigin = originFilter === 'ALL' || s.origin === originFilter;
      const matchesDestination = destinationFilter === 'ALL' || s.destination === destinationFilter;
      const matchesDriver = driverFilter === 'ALL' || s.assignedDriverId === driverFilter;
      
      let matchesDates = true;
      if (startDate || endDate) {
        const shipmentDate = new Date(s.createdAt);
        const start = startDate ? startOfDay(new Date(startDate)) : new Date(0);
        const end = endDate ? endOfDay(new Date(endDate)) : new Date(8640000000000000);
        matchesDates = isWithinInterval(shipmentDate, { start, end });
      }

      return matchesSearch && matchesStatus && matchesOrigin && matchesDestination && matchesDriver && matchesDates;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      
      let valA: any;
      let valB: any;

      if (key === 'driver') {
        const driverA = drivers.find(d => d.id === a.assignedDriverId)?.name || '';
        const driverB = drivers.find(d => d.id === b.assignedDriverId)?.name || '';
        valA = driverA;
        valB = driverB;
      } else {
        valA = (a as any)[key];
        valB = (b as any)[key];
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ column }: { column: keyof Shipment | 'eta' | 'driver' }) => {
    if (!sortConfig || sortConfig.key !== column) return <div className="w-3" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const handleDriverChange = (shipmentId: string, trackingNumber: string, driverId: string) => {
    if (!driverId) {
      assignDriver(shipmentId, '');
      return;
    }
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setAssignConfirmation({
        shipmentId,
        driverId,
        driverName: driver.name,
        trackingNumber
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Tracking Number', 'Status', 'Driver', 'Origin', 'Destination', 'Estimated Delivery', 'Created At'];
    const rows = filtered.map(s => [
      s.trackingNumber,
      s.status,
      drivers.find(d => d.id === s.assignedDriverId)?.name || 'Unassigned',
      s.origin,
      s.destination,
      s.estimatedDelivery,
      s.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shipments_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)));
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedShipmentIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedShipmentIds(newExpanded);
  };

  const handleSaveLocation = () => {
    if (editingCell) {
      updateLocation(editingCell.id, editingCell.field, editingCell.value);
      setEditingCell(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment Management</h1>
          <p className="text-gray-500 text-sm">Monitor and update active freight movements</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsNewShipmentModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            New Shipment
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by tracking, origin, or destination..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md outline-none focus:border-blue-500 transition-colors shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600 outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DELAYED">Delayed</option>
            </select>
            <button 
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border ${showMoreFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              {showMoreFilters ? 'Hide Filters' : 'More Filters'}
            </button>
          </div>
        </div>

        {showMoreFilters && (
          <div className="technical-card p-4 bg-gray-50/50 border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Origin Hub</label>
              <select 
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
              >
                <option value="ALL">All Origins</option>
                {origins.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Destination Hub</label>
              <select 
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
              >
                <option value="ALL">All Destinations</option>
                {destinations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Assigned Driver</label>
              <select 
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
              >
                <option value="ALL">All Drivers</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Created Between</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md text-[10px] text-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-300">to</span>
                <input 
                  type="date" 
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md text-[10px] text-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end pb-0.5">
              <button 
                onClick={() => {
                  setOriginFilter('ALL');
                  setDestinationFilter('ALL');
                  setDriverFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear All filters
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-blue-600 px-6 py-3 rounded-lg flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-bold">{selectedIds.size} Shipments Selected</span>
            <div className="h-4 w-px bg-blue-400" />
            <button 
              onClick={() => {
                bulkUpdateStatus(Array.from(selectedIds), 'DELIVERED');
                setSelectedIds(new Set());
              }}
              className="text-white text-xs font-bold hover:bg-white/10 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark Delivered
            </button>
            <button 
              onClick={() => {
                bulkUpdateStatus(Array.from(selectedIds), 'DELAYED');
                setSelectedIds(new Set());
              }}
              className="text-white text-xs font-bold hover:bg-white/10 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Mark Delayed
            </button>
          </div>
          <button 
            onClick={() => setSelectedIds(new Set())}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="technical-card">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading shipments...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 w-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th 
                      className="data-grid-header cursor-pointer group"
                      onClick={() => handleSort('trackingNumber')}
                    >
                      <div className="flex items-center gap-1">
                        Tracking # <SortIcon column="trackingNumber" />
                      </div>
                    </th>
                    <th 
                      className="data-grid-header cursor-pointer group"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status <SortIcon column="status" />
                      </div>
                    </th>
                    <th 
                      className="data-grid-header cursor-pointer group"
                      onClick={() => handleSort('driver')}
                    >
                      <div className="flex items-center gap-1">
                        Driver <SortIcon column="driver" />
                      </div>
                    </th>
                    <th className="data-grid-header">Route</th>
                    <th 
                      className="data-grid-header cursor-pointer group"
                      onClick={() => handleSort('estimatedDelivery')}
                    >
                      <div className="flex items-center gap-1">
                        Estimated Delivery <SortIcon column="estimatedDelivery" />
                      </div>
                    </th>
                    <th className="data-grid-header">Quick Actions</th>
                    <th className="data-grid-header w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((s) => (
                    <React.Fragment key={s.id}>
                      <tr 
                        className={`data-grid-row cursor-pointer transition-colors ${selectedIds.has(s.id) ? 'bg-blue-50/30' : ''}`}
                        onClick={() => setSelectedShipment(s)}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleSelect(s.id)}
                          />
                        </td>
                        <td className="data-grid-cell">
                          <div className="font-bold text-gray-900 group-hover:text-blue-600">{s.trackingNumber}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5">ID: {s.id}</div>
                        </td>
                        <td className="data-grid-cell">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="data-grid-cell" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <select
                              className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                              value={s.assignedDriverId || ''}
                              onChange={(e) => handleDriverChange(s.id, s.trackingNumber, e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="data-grid-cell" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 group/field">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              {editingCell?.id === s.id && editingCell?.field === 'origin' ? (
                                <div className="flex items-center gap-1">
                                  <input 
                                    autoFocus
                                    className="text-xs border border-blue-500 rounded px-1 outline-none w-24"
                                    value={editingCell.value}
                                    onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveLocation();
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                  />
                                  <button onClick={handleSaveLocation} className="text-emerald-500 hover:bg-emerald-50 p-0.5 rounded">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setEditingCell(null)} className="text-red-500 hover:bg-red-50 p-0.5 rounded">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  onClick={() => setEditingCell({ id: s.id, field: 'origin', value: s.origin })}
                                  className="truncate max-w-[100px] hover:text-blue-600 transition-colors decoration-dotted underline underline-offset-4 decoration-gray-300"
                                >
                                  {s.origin.split(',')[0]}
                                </span>
                              )}
                              <span className="text-gray-300">→</span>
                              {editingCell?.id === s.id && editingCell?.field === 'destination' ? (
                                <div className="flex items-center gap-1">
                                  <input 
                                    autoFocus
                                    className="text-xs border border-blue-500 rounded px-1 outline-none w-24"
                                    value={editingCell.value}
                                    onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveLocation();
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                  />
                                  <button onClick={handleSaveLocation} className="text-emerald-500 hover:bg-emerald-50 p-0.5 rounded">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setEditingCell(null)} className="text-red-500 hover:bg-red-50 p-0.5 rounded">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  onClick={() => setEditingCell({ id: s.id, field: 'destination', value: s.destination })}
                                  className="truncate max-w-[100px] hover:text-blue-600 transition-colors decoration-dotted underline underline-offset-4 decoration-gray-300"
                                >
                                  {s.destination.split(',')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="data-grid-cell">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {format(new Date(s.estimatedDelivery), 'MMM dd, HH:mm')}
                          </div>
                        </td>
                        <td className="data-grid-cell" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {s.status === 'PENDING' && (
                              <button 
                                onClick={() => updateStatus(s.id, 'IN_TRANSIT')}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                title="Mark as In Transit"
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {s.status === 'IN_TRANSIT' && (
                              <button 
                                onClick={() => updateStatus(s.id, 'DELIVERED')}
                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                                title="Mark as Delivered"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={() => updateStatus(s.id, 'DELAYED')}
                              className="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"
                              title="Mark as Delayed"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => toggleExpand(s.id)}
                            className={`p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-transform ${expandedShipmentIds.has(s.id) ? 'rotate-90' : ''}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {expandedShipmentIds.has(s.id) && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={9} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-left duration-300">
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 border-l-2 border-blue-500">Route Information</h4>
                                <div className="space-y-3">
                                  <div className="bg-white p-3 rounded border border-gray-100">
                                    <p className="text-[10px] text-gray-400 mb-1">Pick-up Origin</p>
                                    <p className="text-xs font-medium text-gray-700">{s.origin}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border border-gray-100">
                                    <p className="text-[10px] text-gray-400 mb-1">Drop-off Destination</p>
                                    <p className="text-xs font-medium text-gray-700">{s.destination}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 border-l-2 border-emerald-500">Logistics Data</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white p-3 rounded border border-gray-100">
                                    <p className="text-[10px] text-gray-400 mb-1">Assigned Driver</p>
                                    <p className="text-xs font-medium text-gray-700">
                                      {drivers.find(d => d.id === s.assignedDriverId)?.name || 'Needs Assignment'}
                                    </p>
                                  </div>
                                  <div className="bg-white p-3 rounded border border-gray-100">
                                    <p className="text-[10px] text-gray-400 mb-1">Weight / Volume</p>
                                    <p className="text-xs font-medium text-gray-700">12.5t / 45m³</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border border-gray-100">
                                    <p className="text-[10px] text-gray-400 mb-1">Temperature</p>
                                    <p className="text-xs font-medium text-emerald-600">Ambient (22°C)</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border border-gray-100">
                                    <p className="text-[10px] text-gray-400 mb-1">Priority</p>
                                    <p className="text-xs font-medium text-gray-700">High</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4 col-span-1 md:col-span-2">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 border-l-2 border-purple-500">Shipment History</h4>
                                <div className="bg-white p-4 rounded border border-gray-100 h-[220px] overflow-y-auto">
                                  {s.history && s.history.length > 0 ? (
                                    <div className="relative pl-4 space-y-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                      {[...s.history].reverse().map((event, i) => (
                                        <div key={i} className="relative">
                                          <div className={`absolute -left-[14px] top-1.5 w-2 h-2 rounded-full border-2 border-white z-10 ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                          <div className="flex justify-between items-start gap-4">
                                            <div>
                                              <p className={`text-[10px] font-bold uppercase tracking-tight ${i === 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                                                {event.status.replace('_', ' ')}
                                              </p>
                                              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{event.note}</p>
                                              <p className="text-[9px] text-gray-400 mt-0.5 italic">{event.location}</p>
                                            </div>
                                            <p className="text-[9px] font-mono text-gray-400 whitespace-nowrap bg-gray-50 px-1 rounded">
                                              {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                      <History className="w-8 h-8 text-gray-300 mb-2" />
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">No Event History Recorded</p>
                                    </div>
                                  )}
                                </div>
                                <button 
                                  onClick={() => setSelectedShipment(s)}
                                  className="w-full mt-2 py-2 bg-gray-900 text-white text-[10px] font-bold rounded uppercase tracking-widest hover:bg-gray-800 transition-colors"
                                >
                                  Open Full Tracking Details
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="technical-card h-[600px] overflow-hidden relative">
          {!hasValidKey ? (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div className="max-w-md space-y-4">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-gray-900">Google Maps API Key Required</h3>
                <p className="text-sm text-gray-500">To enable the real-time map view, please add your Google Maps Platform API key to the project secrets.</p>
                <div className="bg-gray-50 p-4 rounded-lg text-left text-xs space-y-2 border border-gray-100">
                  <p><strong>1.</strong> Get a key from the Google Cloud Console.</p>
                  <p><strong>2.</strong> Open <strong>Settings</strong> (⚙️) → <strong>Secrets</strong>.</p>
                  <p><strong>3.</strong> Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> with your key.</p>
                </div>
              </div>
            </div>
          ) : (
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
                defaultZoom={4}
                mapId="SHIPMENT_LIVE_VIEW"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {filtered.map(s => (
                  <ShipmentMarker key={s.id} shipment={s} onClick={() => setSelectedShipment(s)} />
                ))}
              </Map>
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-lg shadow-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase">In Transit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Delivered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Delayed</span>
                  </div>
                </div>
              </div>
            </APIProvider>
          )}
        </div>
      )}

      <Modal
        isOpen={isNewShipmentModalOpen}
        onClose={() => setIsNewShipmentModalOpen(false)}
        title="Create New Freight Assignment"
      >
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Origin Hub</label>
              <input 
                required
                type="text" 
                placeholder="e.g. New York Port"
                className="technical-input w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded focus:border-blue-500 outline-none"
                value={newShipment.origin}
                onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Destination Hub</label>
              <input 
                required
                type="text" 
                placeholder="e.g. London Gateway"
                className="technical-input w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded focus:border-blue-500 outline-none"
                value={newShipment.destination}
                onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Estimated Delivery</label>
              <input 
                required
                type="datetime-local" 
                className="technical-input w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded focus:border-blue-500 outline-none"
                value={newShipment.estimatedDelivery}
                onChange={(e) => setNewShipment({ ...newShipment, estimatedDelivery: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tracking Override (Optional)</label>
              <input 
                type="text" 
                placeholder="Auto-generated if empty"
                className="technical-input w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded focus:border-blue-500 outline-none"
                value={newShipment.trackingNumber}
                onChange={(e) => setNewShipment({ ...newShipment, trackingNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => setIsNewShipmentModalOpen(false)}
              className="flex-1 py-3 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-100 uppercase tracking-widest"
            >
              Deploy Shipment
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedShipment}
        onClose={() => setSelectedShipment(null)}
        title={`Shipment ${selectedShipment?.trackingNumber}`}
      >
        {selectedShipment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedShipment.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ETA</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {format(new Date(selectedShipment.estimatedDelivery), 'PPPPp')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 rounded-md">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Origin</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-gray-700 font-medium">{selectedShipment.origin}</p>
                </div>
              </div>
              <div className="p-3 border border-gray-100 rounded-md">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Destination</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <p className="text-xs text-gray-700 font-medium">{selectedShipment.destination}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tracking History</h3>
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-1 before:bottom-1 before:w-px before:bg-gray-100">
                {(selectedShipment.history || []).map((event, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white bg-blue-500 z-10" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-900 uppercase tracking-tighter">{event.status.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{event.note}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {event.location}
                        </p>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!selectedShipment.history || selectedShipment.history.length === 0) && (
                  <p className="text-xs text-gray-400 italic">No tracking updates recorded yet.</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                className="flex-1 py-3 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors uppercase tracking-widest"
                onClick={() => setSelectedShipment(null)}
              >
                Close View
              </button>
              <button className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-100 uppercase tracking-widest">
                Print Manifest
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!assignConfirmation}
        onClose={() => setAssignConfirmation(null)}
        title="Confirm Driver Assignment"
      >
        {assignConfirmation && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800 leading-relaxed">
                Assign driver <span className="font-bold underline">{assignConfirmation.driverName}</span> to 
                shipment <span className="font-mono font-bold">{assignConfirmation.trackingNumber}</span>?
              </p>
              <p className="text-[10px] text-blue-600 mt-2 italic font-medium uppercase tracking-wider">Note: This will notify the driver terminal immediately via secure 5G link.</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setAssignConfirmation(null)}
                className="flex-1 py-2.5 bg-gray-50 text-gray-600 text-xs font-bold rounded hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  assignDriver(assignConfirmation.shipmentId, assignConfirmation.driverId);
                  setAssignConfirmation(null);
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors shadow-sm uppercase tracking-widest"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
