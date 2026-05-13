/**
 * Hook for managing browser profiles in admin panel
 */

import { useState, useCallback, useEffect } from 'react';
import { useAdminFetch } from './useAdminFetch';
import { useAuthGuard } from './useAuthGuard';

export interface BrowserProfile {
    id: string;
    platform: string;
    label: string;
    user_agent: string;
    sec_ch_ua: string | null;
    sec_ch_ua_platform: string | null;
    sec_ch_ua_mobile: string;
    accept_language: string;
    browser: string;
    device_type: string;
    os: string | null;
    is_chromium: boolean;
    priority: number;
    enabled: boolean;
    use_count: number;
    success_count: number;
    error_count: number;
    last_used_at: string | null;
    last_error: string | null;
    note: string | null;
    created_at: string;
    updated_at: string;
}

export interface BrowserProfileStats {
    platform: string;
    browser: string;
    device_type: string;
    total: number;
    enabled_count: number;
    total_uses: number;
    total_success: number;
    total_errors: number;
}

export interface BrowserProfileTotals {
    total: number;
    enabled: number;
    totalUses: number;
    totalSuccess: number;
    totalErrors: number;
}

export interface CreateProfileInput {
    platform?: string;
    label: string;
    user_agent: string;
    sec_ch_ua?: string | null;
    sec_ch_ua_platform?: string | null;
    sec_ch_ua_mobile?: string;
    accept_language?: string;
    browser?: string;
    device_type?: string;
    os?: string | null;
    is_chromium?: boolean;
    priority?: number;
    enabled?: boolean;
    note?: string | null;
}

export function useBrowserProfiles() {
    // Fetch browser profiles data using useAdminFetch
    interface ProfilesResponse {
        profiles: BrowserProfile[];
        stats: BrowserProfileStats[];
        totals: BrowserProfileTotals;
    }

    const {
        data: profilesData,
        loading,
        error: fetchError,
        refetch,
        mutate
    } = useAdminFetch<ProfilesResponse>('/api/admin/browser-profiles', { skip: useAuthGuard().skip });

    // Local state for UI error messages
    const [error, setError] = useState<string | null>(null);

    // Initialize default values
    const [profiles, setProfiles] = useState<BrowserProfile[]>([]);
    const [stats, setStats] = useState<BrowserProfileStats[]>([]);
    const [totals, setTotals] = useState<BrowserProfileTotals>({
        total: 0,
        enabled: 0,
        totalUses: 0,
        totalSuccess: 0,
        totalErrors: 0,
    });

    // Update local state when profilesData changes
    useEffect(() => {
        if (profilesData) {
            setProfiles(profilesData.profiles || []);
            setStats(profilesData.stats || []);
            setTotals(profilesData.totals || {
                total: 0,
                enabled: 0,
                totalUses: 0,
                totalSuccess: 0,
                totalErrors: 0,
            });
            setError(null);
        }
    }, [profilesData]);

    // Update error state from fetch error
    useEffect(() => {
        if (fetchError) {
            setError(fetchError.userMessage);
        }
    }, [fetchError]);

    const createProfile = useCallback(async (input: CreateProfileInput): Promise<BrowserProfile | null> => {
        try {
            const result = await mutate('POST', input);
            if (result.success) {
                await refetch();
                return result.data as BrowserProfile;
            }
            setError(result.error || 'Failed to create profile');
            return null;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
            setError(errorMessage);
            return null;
        }
    }, [mutate, refetch]);

    const updateProfile = useCallback(async (id: string, updates: Partial<CreateProfileInput>): Promise<boolean> => {
        try {
            const result = await mutate('PATCH', updates, `/api/admin/browser-profiles/${id}`);
            if (result.success) {
                await refetch();
                return true;
            }
            setError(result.error || 'Failed to update profile');
            return false;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
            setError(errorMessage);
            return false;
        }
    }, [mutate, refetch]);

    const deleteProfile = useCallback(async (id: string): Promise<boolean> => {
        try {
            const result = await mutate('DELETE', undefined, `/api/admin/browser-profiles/${id}`);
            if (result.success) {
                await refetch();
                return true;
            }
            setError(result.error || 'Failed to delete profile');
            return false;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
            setError(errorMessage);
            return false;
        }
    }, [mutate, refetch]);

    const toggleProfile = useCallback(async (id: string, enabled: boolean): Promise<boolean> => {
        return updateProfile(id, { enabled });
    }, [updateProfile]);

    const resetStats = useCallback(async (id: string): Promise<boolean> => {
        try {
            const result = await mutate('PATCH', {
                use_count: 0,
                success_count: 0,
                error_count: 0,
                last_error: null,
            }, `/api/admin/browser-profiles/${id}`);
            if (result.success) {
                await refetch();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [mutate, refetch]);

    return {
        profiles,
        stats,
        totals,
        loading,
        error,
        refetch,
        createProfile,
        updateProfile,
        deleteProfile,
        toggleProfile,
        resetStats,
    };
}

// Platform options
export const PLATFORM_OPTIONS = [
    { value: 'all', label: 'All Platforms' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'weibo', label: 'Weibo' },
];

// Browser options
export const BROWSER_OPTIONS = [
    { value: 'chrome', label: 'Chrome' },
    { value: 'firefox', label: 'Firefox' },
    { value: 'safari', label: 'Safari' },
    { value: 'edge', label: 'Edge' },
    { value: 'opera', label: 'Opera' },
    { value: 'other', label: 'Other' },
];

// Device type options
export const DEVICE_OPTIONS = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' },
];

// OS options
export const OS_OPTIONS = [
    { value: 'windows', label: 'Windows' },
    { value: 'macos', label: 'macOS' },
    { value: 'linux', label: 'Linux' },
    { value: 'ios', label: 'iOS' },
    { value: 'android', label: 'Android' },
];
