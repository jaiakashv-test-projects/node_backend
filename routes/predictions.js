const express = require("express");
const router = express.Router();

const pool = require("../services/db");


// ----------------------------------------
// Generate insights from predictions
// ----------------------------------------
router.get("/generate-insights", async (req, res) => {

  try {

    console.log("Fetching predictions...");

    // Get all predictions
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


    console.log("Deleting old insights...");

    await pool.query(`DELETE FROM insights`);


    const insights = [];


    for (const prediction of predictions) {

      const route = prediction.route_name;
      const date = prediction.travel_date;
      const predictedSeats = prediction.predicted_filled_seats;


      // Get latest real capacity from redbus_fill_rates
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


      let capacity = 1600; // fallback default


      if (capacityResult.rows.length > 0) {

        capacity = capacityResult.rows[0].total_capacity;

      }


      const fillRate = (predictedSeats / capacity) * 100;


      let demandLevel = "LOW";
      let recommendation = "Normal demand";


      if (fillRate >= 75) {

        demandLevel = "HIGH";
        recommendation = "Add extra buses immediately";

      } else if (fillRate >= 50) {

        demandLevel = "MEDIUM";
        recommendation = "Monitor demand";

      }


      const insight = {

        route,
        date,
        predictedSeats,
        capacity,
        fillRate: fillRate.toFixed(2),
        demandLevel,
        recommendation

      };


      insights.push(insight);


      // Save to Neon insights table
      await pool.query(

        `
        INSERT INTO insights
        (
          route_name,
          travel_date,
          predicted_filled_seats,
          demand_level,
          recommendation,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        `,

        [
          route,
          date,
          predictedSeats,
          demandLevel,
          recommendation
        ]

      );

    }


    console.log("Insights stored successfully");


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


// ----------------------------------------
// Fetch insights API
// ----------------------------------------
router.get("/insights", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM insights
      ORDER BY travel_date
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({

      error: "Failed to fetch insights"

    });

  }

});


module.exports = router;
