// GitHub Gist service for persisting candle data
const GIST_ID = import.meta.env.VITE_GIST_ID;
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
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

      if (!fileContent) {
        // If file doesn't exist or is empty, return empty array
        return [];
      }

      const data = JSON.parse(fileContent);
      return Array.isArray(data) ? data : [];
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
        throw new Error("No GitHub token configured");
      }

      if (!Array.isArray(candles)) {
        console.error("Invalid candles data - must be an array");
        throw new Error("Invalid candles data");
      }

      const response = await fetch(`${this.baseUrl}/${GIST_ID}`, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          files: {
            [FILENAME]: {
              content: JSON.stringify(candles, null, 2),
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update gist: ${response.status} - ${errorText}`
        );
      }

      return true;
    } catch (error) {
      console.error("Error saving candles to Gist:", error);
      throw error; // Re-throw so the app can handle it
    }
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!(GITHUB_TOKEN && GIST_ID);
  }

  /**
   * Get configuration status details
   * @returns {Object} Configuration details
   */
  getConfigStatus() {
    return {
      hasToken: !!GITHUB_TOKEN,
      hasGistId: !!GIST_ID,
      isConfigured: this.isConfigured(),
    };
  }
}

// Export a singleton instance
export const gistService = new GistService();
export default gistService;
