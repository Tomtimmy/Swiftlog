export type UserRole = 'ADMIN' | 'COORDINATOR' | 'DRIVER' | 'WAREHOUSE_OFFICER' | 'TEAM_MEMBER';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' | 'RECEIVED';

export interface Expense {
  id: string;
  tenantId: string;
  userId: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  vendor: string;
  date: string;
  status: ExpenseStatus;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}
export interface User {
  uid: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type ShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED';

export interface ShipmentHistory {
  timestamp: string;
  location: string;
  status: ShipmentStatus;
  note: string;
}

export interface Shipment {
  id: string;
  tenantId: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  assignedDriverId?: string;
  currentLat?: number;
  currentLng?: number;
  history?: ShipmentHistory[];
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  isPersonal?: boolean;
  isSyncing?: boolean;
  assignedUserId?: string;
  shipmentId?: string;
  dueDate?: string;
  createdAt: string;
}

export type TransferStatus = 'REQUESTED' | 'IN_TRANSIT' | 'RECEIVED';

export interface StockTransfer {
  id: string;
  tenantId: string;
  source: string;
  destination: string;
  sku: string;
  quantity: number;
  status: TransferStatus;
  initiatedBy: string;
  receivedBy?: string;
  createdAt: string;
}

export interface InventoryItem {
  sku: string;
  name: string;
  quantity: number;
  locationId: string;
  tenantId: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}
