export class SadafApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;

    constructor(message: string, status = 502, code = 'sadaf_api_error', details?: unknown) {
        super(message);
        this.name = 'SadafApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
