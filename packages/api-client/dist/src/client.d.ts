import { AxiosInstance } from 'axios';
export declare const apiClient: AxiosInstance;
export declare const setAuthHandlers: (handlers: {
    getTokens: () => {
        accessToken: string | null;
        refreshToken: string | null;
    };
    refreshTokens: () => Promise<void>;
    clearTokens: () => Promise<void>;
}) => void;
export default apiClient;
//# sourceMappingURL=client.d.ts.map