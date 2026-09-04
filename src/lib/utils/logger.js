/**
 * Lightweight structured logger for server-side code.
 * Outputs single-line JSON objects to stdout/stderr.
 *
 * @param {string} ctx - The component context (e.g., 'Pipeline', 'Provider')
 * @param {string} reqId - Optional request ID to correlate logs
 */
export function createLogger(ctx, reqId = null) {
  const formatLog = (level, msg, data = null) => {
    const entry = {
      level,
      ts: new Date().toISOString(),
      ...(reqId && { reqId }),
      ctx,
      msg,
      ...(data && { data })
    };
    return JSON.stringify(entry);
  };

  return {
    info: (msg, data) => console.log(formatLog('info', msg, data)),
    warn: (msg, data) => console.warn(formatLog('warn', msg, data)),
    error: (msg, data) => console.error(formatLog('error', msg, data))
  };
}
