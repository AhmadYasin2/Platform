// Rate limiter for Grok API (8 RPS limit)
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests = 8
  private readonly windowMs = 1000 // 1 second

  async waitForSlot(): Promise<void> {
    const now = Date.now()

    // Remove requests older than the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs)

    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.windowMs - (now - oldestRequest) + 10 // Add 10ms buffer

      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        return this.waitForSlot() // Recursive call after waiting
      }
    }

    // Add current request to the queue
    this.requests.push(now)
  }
}

export const grokRateLimiter = new RateLimiter()
