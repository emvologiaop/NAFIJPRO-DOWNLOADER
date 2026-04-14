/**
 * API Key Manager - Client-side helper for secure API key operations
 * Handles testing, encryption, and audit logging
 */

interface TestKeyRequest {
    provider: 'groq' | 'openai' | 'gemini' | 'claude' | 'azure';
    api_key: string;
    model: string;
}

interface TestKeyResponse {
    success: boolean;
    message: string;
    tokens_used?: number;
}

/**
 * Test an API key to verify validity before storing
 */
export async function testApiKey(
    request: TestKeyRequest,
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
): Promise<TestKeyResponse> {
    try {
        const response = await adminFetch('/api/admin/ai-keys/test', {
            method: 'POST',
            body: JSON.stringify(request),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return {
            success: true,
            message: data.message || 'Key is valid',
            tokens_used: data.tokens_used,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Test failed',
        };
    }
}

/**
 * Get all active API keys
 */
export async function getActiveKeys(
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch('/api/admin/ai-keys?status=active');
    if (!response.ok) throw new Error('Failed to fetch active keys');
    return response.json();
}

/**
 * Get API key by provider
 */
export async function getKeyByProvider(
    provider: string,
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch(`/api/admin/ai-keys?provider=${provider}`);
    if (!response.ok) throw new Error(`Failed to fetch ${provider} keys`);
    return response.json();
}

/**
 * Get all keys with masked values
 */
export async function getMaskedKeys(
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch('/api/admin/ai-keys?masked=true');
    if (!response.ok) throw new Error('Failed to fetch masked keys');
    return response.json();
}

/**
 * Get provider status dashboard
 */
export async function getProviderStatus(
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch('/api/admin/ai-keys/status');
    if (!response.ok) throw new Error('Failed to fetch provider status');
    return response.json();
}

/**
 * Create new API key
 */
export async function createApiKey(
    {
        provider,
        api_key,
        model,
        priority_order,
        enabled,
    }: {
        provider: string;
        api_key: string;
        model: string;
        priority_order: number;
        enabled: boolean;
    },
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch('/api/admin/ai-keys', {
        method: 'POST',
        body: JSON.stringify({
            provider,
            api_key,
            model,
            priority_order,
            enabled,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || 'Failed to create API key');
    }

    return response.json();
}

/**
 * Update API key
 */
export async function updateApiKey(
    id: string,
    updates: Partial<{
        model: string;
        priority_order: number;
        enabled: boolean;
    }>,
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch(`/api/admin/ai-keys/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || 'Failed to update API key');
    }

    return response.json();
}

/**
 * Disable API key
 */
export async function disableApiKey(
    id: string,
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    return updateApiKey(id, { enabled: false }, adminFetch);
}

/**
 * Enable API key
 */
export async function enableApiKey(
    id: string,
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    return updateApiKey(id, { enabled: true }, adminFetch);
}

/**
 * Soft delete API key (marks as deleted but keeps history)
 */
export async function softDeleteApiKey(
    id: string,
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch(`/api/admin/ai-keys/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ soft: true }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || 'Failed to delete API key');
    }

    return response.json();
}

/**
 * Rotate API key
 */
export async function rotateApiKey(
    id: string,
    newKey: string,
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch(`/api/admin/ai-keys/${id}/rotate`, {
        method: 'POST',
        body: JSON.stringify({ new_key: newKey }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || 'Failed to rotate API key');
    }

    return response.json();
}

/**
 * Log audit event for API key operations
 */
export async function logAudit(
    {
        action,
        key_id,
        provider,
        details,
    }: {
        action: 'created' | 'updated' | 'deleted' | 'tested' | 'rotated';
        key_id: string;
        provider: string;
        details?: Record<string, any>;
    },
    adminFetch: (url: string, options?: RequestInit) => Promise<Response>
) {
    const response = await adminFetch('/api/admin/ai-keys/audit', {
        method: 'POST',
        body: JSON.stringify({
            action,
            key_id,
            provider,
            details,
            timestamp: new Date().toISOString(),
        }),
    });

    if (!response.ok) {
        console.error('Failed to log audit event:', await response.text());
    }

    return response.ok;
}
