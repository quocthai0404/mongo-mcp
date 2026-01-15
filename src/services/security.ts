import { isToolAllowed, isWriteOperation, getConfig } from '../types/config.js';
export interface SecurityCheckResult {
    allowed: boolean;
    reason?: string;
}
export function checkToolSecurity(toolName: string): SecurityCheckResult {
    return isToolAllowed(toolName);
}
export function withSecurityCheck<T extends object>(
    toolName: string,
    handler: () => Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }>
): Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }> {
    const check = checkToolSecurity(toolName);
    if (!check.allowed) {
        return Promise.resolve({
            content: [
                {
                    type: 'text' as const,
                    text: `🔒 **Security Block**: ${check.reason}`,
                },
            ],
            isError: true,
        });
    }
    return handler();
}
export function getSecuritySummary(): string {
    const config = getConfig();
    const lines: string[] = [
        '🔐 **Security Configuration**',
        '',
        `• Read-Only Mode: ${config.readOnly ? '✅ ENABLED' : '❌ Disabled'}`,
        `• Disabled Tools: ${config.disabledTools.length > 0 ? config.disabledTools.join(', ') : 'None'}`,
    ];
    if (config.readOnly) {
        lines.push('');
        lines.push('ℹ️ Write operations are blocked in read-only mode.');
    }
    return lines.join('\n');
}
