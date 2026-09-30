let predictionChart;

async function loadPrediction() {

    const response = await fetch("/api/predict");
    const data = await response.json();

    console.log("API DATA:", data);

    // Update values
    document.getElementById("predictedEnergy").innerText =
        data.predictedEnergy + " kWh";

    document.getElementById("predictedEfficiency").innerText =
        data.predictedEfficiency;

    document.getElementById("weather").innerText =
        "Weather Forecast: " + data.weather;

    // Animate progress bar
    document.getElementById("predictedBar").style.width =
        (parseFloat(data.predictedEfficiency) * 100) + "%";

    // Recommendation logic
    let recommendation = "";

    if (data.weather === "Sunny") {
        recommendation = "🌞 Excellent solar conditions expected.";
    }
    else if (data.weather === "Cloudy") {
        recommendation = "☁ Moderate generation expected due to cloud cover.";
    }
    else {
        recommendation = "🌧 Rain expected. Solar production will reduce.";
    }

    document.getElementById("recommendation").innerText = recommendation;

    generatePredictionChart(parseFloat(data.predictedEnergy));
}

function generatePredictionChart(value) {

    const ctx = document.getElementById("predictionChart").getContext("2d");

    if (predictionChart) predictionChart.destroy();

    predictionChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Estimated Today", "Tomorrow Prediction"],
            datasets: [{
                label: "Energy Forecast (kWh)",
                data: [value * 0.9, value],
                backgroundColor: ["#00ffcc", "#00ccff"]
            }]
        }
    });
}

loadPrediction();