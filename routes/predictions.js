const express = require("express");
const router = express.Router();

const { fetchPredictions } = require("../services/mlService");
const pool = require("../services/db");


// Save insights to Neon DB
async function saveInsights(insights) {

  await pool.query("DELETE FROM insights");

  for (const item of insights) {

    await pool.query(

      `
      INSERT INTO insights
      (route_name, travel_date, predicted_filled_seats, demand_level, recommendation)
      VALUES ($1, $2, $3, $4, $5)
      `,

      [
        item.route,
        item.date,
        item.predictedSeats,
        item.demandLevel,
        item.recommendation
      ]

    );

  }

}


// Generate and store insights
router.get("/generate-insights", async (req, res) => {

  try {

    const predictions = await fetchPredictions();

    const insights = predictions.map(item => {

      let demandLevel = "LOW";
      let recommendation = "No action needed";

      if (item.predicted_filled_seats > 1400) {

        demandLevel = "HIGH";
        recommendation = "Add extra buses";

      } else if (item.predicted_filled_seats > 800) {

        demandLevel = "MEDIUM";
        recommendation = "Monitor demand";

      }

      return {

        route: item.route_name,
        date: item.travel_date,
        predictedSeats: item.predicted_filled_seats,
        demandLevel,
        recommendation

      };

    });

    await saveInsights(insights);

    res.json({
      message: "Insights generated and stored successfully",
      insights
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to generate insights"
    });

  }

});


// Fetch insights from Neon
router.get("/insights", async (req, res) => {

  try {

    const result = await pool.query(

      "SELECT * FROM insights ORDER BY created_at DESC"

    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: "Failed to fetch insights"
    });

  }

});


module.exports = router;
