/**
 * Auth extension for Hocuspocus
 * Reads authentication headers set by Go reverse proxy
 */
export class AuthExtension {
  async onConnect(data) {
    const readOnly = data.requestHeaders['x-read-only'] === 'true'
    if (readOnly) {
      data.connection.readOnly = true
    }
  }
}
