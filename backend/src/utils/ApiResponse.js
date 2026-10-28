class ApiResponse {
  constructor(statusCode, message, data = null, meta = {}) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
    Object.assign(this, meta);
  }

  send(res) {
    const payload = {
      success: this.success,
      message: this.message,
    };

    if (this.data !== undefined && this.data !== null) {
      payload.data = this.data;
    }

    // Include pagination or other metadata properties
    const keys = Object.keys(this).filter(
      (key) => !['statusCode', 'success', 'message', 'data'].includes(key)
    );
    for (const key of keys) {
      payload[key] = this[key];
    }

    return res.status(this.statusCode).json(payload);
  }
}

module.exports = ApiResponse;

