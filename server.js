const express = require("express");
const cors = require("cors");
require("dotenv").config();

const predictionRoutes = require("./routes/predictions");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/predictions", predictionRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "TravelFlux Node.js Backend Running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
