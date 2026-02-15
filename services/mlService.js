const axios = require("axios");

const ML_API = process.env.ML_API;

async function fetchPredictions() {

  try {

    const response = await axios.get(`${ML_API}/predictions`, {

      timeout: 60000  // wait up to 60 seconds

    });

    return response.data;

  } catch (error) {

    console.log("Retrying ML API...");

    // retry once
    const retryResponse = await axios.get(`${ML_API}/predictions`, {

      timeout: 60000

    });

    return retryResponse.data;

  }

}

module.exports = {
  fetchPredictions
};
