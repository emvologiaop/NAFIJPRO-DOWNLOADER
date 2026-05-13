'use client';

import { useEffect, useState } from 'react';
import { hasAdminPassword } from './useAdminFetch';

/**
 * Hook to check if user has admin authentication
 * Returns skip flag to pass to useAdminFetch to prevent unauthorized requests
 * 
 * Usage:
 * const { skip } = useAuthGuard();
 * const { data } = useAdminFetch('/api/admin/stats', { skip });
 */
export function useAuthGuard(requiredRole: 'user' | 'admin' = 'admin') {
    const [skip, setSkip] = useState(true); // Start by skipping - safe default
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (hasAdminPassword()) {
            setIsAuthenticated(true);
            setSkip(false); // Password exists, allow requests
        } else {
            setIsAuthenticated(false);
            setSkip(true); // No password, skip requests
        }
    }, [requiredRole]);

    return {
        skip,
        isAuthenticated,
    };
}
