// Custom error class that carries an HTTP status code.
// Controllers throw this instead of calling res.status() directly —
// the central error middleware reads .statusCode and shapes the response.
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
