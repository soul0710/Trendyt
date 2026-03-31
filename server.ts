import express from "express";
import { createServer as createViteServer } from "vite";
import googleTrends from "google-trends-api";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/trends/interest", async (req, res) => {
    try {
      const { keywords, geo, property, days } = req.query;
      
      if (!keywords) {
        return res.status(400).json({ error: "Keywords parameter is required" });
      }

      const keywordArray = (keywords as string).split(",").map(k => k.trim()).filter(Boolean);
      
      if (keywordArray.length === 0) {
        return res.status(400).json({ error: "At least one valid keyword is required" });
      }

      if (keywordArray.length > 5) {
        return res.status(400).json({ error: "Google Trends only supports comparing up to 5 keywords at a time" });
      }
      
      let startTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Past 12 months default
      if (days) {
        startTime = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
      }
      
      const options: any = {
        keyword: keywordArray,
        startTime,
      };

      if (geo && geo !== "global") {
        // If comparing multiple keywords, geo must be an array of the same length
        options.geo = keywordArray.map(() => geo as string);
      }

      if (property && property !== "web") {
        options.property = property as string;
      }

      const results = await googleTrends.interestOverTime(options);
      try {
        res.json(JSON.parse(results));
      } catch (parseError) {
        console.error("Google Trends API returned non-JSON response:", results.substring(0, 200));
        res.status(502).json({ error: "Google Trends API is currently unavailable or rate limited. Please try again later." });
      }
    } catch (error: any) {
      console.error("Error fetching interest over time:", error);
      res.status(500).json({ error: error.message || "Failed to fetch trends data" });
    }
  });

  app.get("/api/trends/daily", async (req, res) => {
    try {
      const { geo } = req.query;
      
      const options: any = {
        geo: (geo as string) || "US",
      };

      const results = await googleTrends.dailyTrends(options);
      try {
        res.json(JSON.parse(results));
      } catch (parseError) {
        console.error("Google Trends API returned non-JSON response:", results.substring(0, 200));
        res.status(502).json({ error: "Google Trends API is currently unavailable or rate limited. Please try again later." });
      }
    } catch (error: any) {
      console.error("Error fetching daily trends:", error);
      res.status(500).json({ error: error.message || "Failed to fetch daily trends" });
    }
  });

  app.get("/api/trends/realtime", async (req, res) => {
    try {
      const { geo, category } = req.query;
      
      const options: any = {
        geo: (geo as string) || "US",
        category: (category as string) || "all",
      };

      const results = await googleTrends.realTimeTrends(options);
      try {
        res.json(JSON.parse(results));
      } catch (parseError) {
        console.error("Google Trends API returned non-JSON response:", results.substring(0, 200));
        res.status(502).json({ error: "Google Trends API is currently unavailable or rate limited. Please try again later." });
      }
    } catch (error: any) {
      console.error("Error fetching realtime trends:", error);
      res.status(500).json({ error: error.message || "Failed to fetch realtime trends" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
