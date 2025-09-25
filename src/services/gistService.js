// GitHub Gist service for persisting candle data
const GIST_ID = import.meta.env.VITE_GIST_ID;
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN; // You'll need to set this
const FILENAME = "candles.json";

class GistService {
  constructor() {
    this.baseUrl = "https://api.github.com/gists";
    this.headers = {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    if (GITHUB_TOKEN) {
      this.headers["Authorization"] = `token ${GITHUB_TOKEN}`;
    }
    // For tracking gist updates and polling
    this.lastUpdated = null;
    this.pollingInterval = null;
    this.isPolling = false;
    this.pollingCallbacks = new Set();
    this.defaultPollingInterval = 1000; // 3 seconds
  }

  /**
   * Fetch candle data from the Gist
   * @returns {Promise<Array>} Array of candle objects
   */
  async loadCandles() {
    try {
      const response = await fetch(`${this.baseUrl}/${GIST_ID}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch gist: ${response.status}`);
      }

      const gist = await response.json();
      const fileContent = gist.files[FILENAME]?.content;
      this.lastUpdated = gist.updated_at;

      if (!fileContent) {
        // If file doesn't exist or is empty, return empty array
        return [];
      }

      const data = JSON.parse(fileContent);
      return data || [];
    } catch (error) {
      console.error("Error loading candles from Gist:", error);
      // Return empty array if there's an error loading
      return [];
    }
  }

  /**
   * Save candle data to the Gist
   * @param {Array} candles - Array of candle objects
   * @returns {Promise<boolean>} Success status
   */
  async saveCandles(candles) {
    try {
      if (!GITHUB_TOKEN) {
        console.warn("No GitHub token provided. Data will not be persisted.");
        return false;
      }

      const data = candles;

      const response = await fetch(`${this.baseUrl}/${GIST_ID}`, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          files: {
            [FILENAME]: {
              content: JSON.stringify(data, null, 2),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update gist: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error saving candles to Gist:", error);
      return false;
    }
  }

  /**
   * Add a new candle
   * @param {Array} currentCandles - Current candles array
   * @param {Object} newCandle - New candle object
   * @returns {Promise<boolean>} Success status
   */
  async addCandle(currentCandles, newCandle) {
    const updatedCandles = [...currentCandles, newCandle];
    return await this.saveCandles(updatedCandles);
  }

  /**
   * Update an existing candle
   * @param {Array} currentCandles - Current candles array
   * @param {number} candleId - ID of candle to update
   * @param {Object} updates - Object with properties to update
   * @returns {Promise<boolean>} Success status
   */
  async updateCandle(currentCandles, candleId, updates) {
    const updatedCandles = currentCandles.map((candle) =>
      candle.id === candleId ? { ...candle, ...updates } : candle
    );
    return await this.saveCandles(updatedCandles);
  }

  /**
   * Remove a candle
   * @param {Array} currentCandles - Current candles array
   * @param {number} candleId - ID of candle to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeCandle(currentCandles, candleId) {
    const updatedCandles = currentCandles.filter(
      (candle) => candle.id !== candleId
    );
    return await this.saveCandles(updatedCandles);
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!GITHUB_TOKEN;
  }
  /**
   * Start polling for gist updates
   * @param {Function} callback - Function to call when updates are detected
   * @param {number} interval - Polling interval in milliseconds
   */
  startPolling(callback, interval = this.defaultPollingInterval) {
    if (this.isPolling) {
      this.pollingCallbacks.add(callback);
      return;
    }

    this.pollingCallbacks.add(callback);
    this.isPolling = true;

    const poll = async () => {
      try {
        const response = await fetch(`${this.baseUrl}/${GIST_ID}`, {
          headers: this.headers,
        });

        if (response.ok) {
          const gist = await response.json();
          const currentUpdated = gist.updated_at;

          // Check if gist has been updated since last check
          if (this.lastUpdated && currentUpdated !== this.lastUpdated) {
            const fileContent = gist.files[FILENAME]?.content;
            if (fileContent) {
              const candles = JSON.parse(fileContent);
              // Notify all callbacks of the update
              this.pollingCallbacks.forEach((cb) =>
                cb(candles, currentUpdated)
              );
            }
          }

          this.lastUpdated = currentUpdated;
        }
      } catch (error) {
        console.error("Polling error:", error);
        // Continue polling even on errors
      }

      if (this.isPolling) {
        this.pollingInterval = setTimeout(poll, interval);
      }
    };

    // Start polling
    poll();
  }

  /**
   * Stop polling for updates
   * @param {Function} callback - Optional specific callback to remove
   */
  stopPolling(callback = null) {
    if (callback) {
      this.pollingCallbacks.delete(callback);
      // If no more callbacks, stop polling entirely
      if (this.pollingCallbacks.size === 0) {
        this.isPolling = false;
        if (this.pollingInterval) {
          clearTimeout(this.pollingInterval);
          this.pollingInterval = null;
        }
      }
    } else {
      // Stop all polling
      this.isPolling = false;
      this.pollingCallbacks.clear();
      if (this.pollingInterval) {
        clearTimeout(this.pollingInterval);
        this.pollingInterval = null;
      }
    }
  }

  /**
   * Get the current polling status
   * @returns {boolean} Whether polling is active
   */
  isPollingActive() {
    return this.isPolling;
  }
}

// Export a singleton instance
export const gistService = new GistService();
export default gistService;
