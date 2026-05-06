import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useAuthContext();
  return { 
    ...context, 
    tenantId: context.user?.tenantId 
  };
}
