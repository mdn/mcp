export class NonSentryError extends Error {
  /**
   * @param {string} message
   * @param {string} gleanReason
   */
  constructor(message, gleanReason) {
    super(message);
    this.gleanReason = gleanReason;
  }
}
