const express = require("express");
const router = express.Router();

const pool = require("../services/db");


// ============================================
// Generate insights from predictions
// ============================================
router.get("/generate-insights", async (req, res) => {

  try {

    console.log("Fetching predictions...");

    const predictionResult = await pool.query(`
      SELECT *
      FROM predictions
      ORDER BY route_name, travel_date
    `);

    const predictions = predictionResult.rows;

    if (predictions.length === 0) {

      return res.json({
        message: "No predictions found"
      });

    }


    console.log("Clearing old insights...");

    await pool.query(`DELETE FROM insights`);


    const insights = [];


    for (const prediction of predictions) {

      const route = prediction.route_name;
      const date = prediction.travel_date;
      const predictedSeats = prediction.predicted_filled_seats;


      // ============================================
      // Fetch real capacity
      // ============================================
      const capacityResult = await pool.query(
        `
        SELECT total_capacity
        FROM redbus_fill_rates
        WHERE route_name = $1
        ORDER BY travel_date DESC
        LIMIT 1
        `,
        [route]
      );


      let capacity = 2000;

      if (capacityResult.rows.length > 0) {

        capacity = capacityResult.rows[0].total_capacity;

      }


      // ============================================
      // Fetch actual fill rate and price (pricing logic)
      // ============================================
      const fillRateResult = await pool.query(
        `
        SELECT fill_rate_percent, average_price
        FROM redbus_fill_rates
        WHERE route_name = $1
        ORDER BY travel_date DESC
        LIMIT 1
        `,
        [route]
      );

      let fillRate;
      let avgPrice = 0;

      if (fillRateResult.rows.length > 0) {
        fillRate = fillRateResult.rows[0].fill_rate_percent;
        avgPrice = Number(fillRateResult.rows[0].average_price) || 0;
      } else {
        fillRate = (predictedSeats / capacity) * 100;
      }

      // ============================================
      // Demand classification and OTA Suggesion
      // ============================================
      let demandLevel = "LOW";
      let recommendation = avgPrice > 0
        ? `Current market avg: ₹${avgPrice}. Maintain pricing.`
        : "Normal demand";

      if (fillRate >= 65) {
        demandLevel = "HIGH";
        const suggestedPrice = avgPrice > 0 ? Math.round(avgPrice * 1.25) : null;
        recommendation = suggestedPrice
          ? `High Demand! Suggested OTA Price: ₹${suggestedPrice} (+25% surge)`
          : "Add extra buses immediately";
      } else if (fillRate >= 40) {
        demandLevel = "MEDIUM";
        const suggestedPrice = avgPrice > 0 ? Math.round(avgPrice * 1.1) : null;
        recommendation = suggestedPrice
          ? `Medium Demand. Suggested OTA Price: ₹${suggestedPrice} (+10%)`
          : "Monitor demand";
      }

      const insight = {
        route,
        date,
        predictedSeats,
        capacity,
        fillRate: fillRate.toFixed(2),
        demandLevel,
        recommendation,
        average_price: avgPrice
      };

      insights.push(insight);

      // ============================================
      // Save insight to Neon
      // ============================================
      await pool.query(
        `
        INSERT INTO insights
        (
          route_name,
          travel_date,
          predicted_filled_seats,
          demand_level,
          recommendation,
          average_price,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `,
        [
          route,
          date,
          predictedSeats,
          demandLevel,
          recommendation,
          avgPrice
        ]
      );

    }


    console.log("Insights generated successfully");


    res.json({

      message: "Insights generated and stored successfully",
      insights

    });


  }
  catch (error) {

    console.error(error);

    res.status(500).json({

      error: "Failed to generate insights"

    });

  }

});


// ============================================
// Fetch insights for dashboard
// ============================================
router.get("/insights", async (req, res) => {

  try {

    const result = await pool.query(
      `
      SELECT *
      FROM insights
      ORDER BY travel_date, route_name
      `
    );

    res.json(result.rows);

  }
  catch (error) {

    console.error(error);

    res.status(500).json({

      error: "Failed to fetch insights"

    });

  }

});


module.exports = router;
