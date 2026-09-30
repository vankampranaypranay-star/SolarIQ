let chart;
let historyChart;
let latestData = {};

async function fetchSolarData() {

    const response = await fetch("/api/solar-data");
    const data = await response.json();

    latestData = data;

    const energy = parseFloat(data.dailyEnergy);
    const co2 = energy * 0.85;
    const money = energy * 6;

    const maxPossible = 9;
    let efficiency = energy / maxPossible;
    efficiency = Math.max(0, Math.min(1, efficiency));

    document.getElementById("energy").innerText = energy.toFixed(2);
    document.getElementById("co2").innerText = co2.toFixed(2);
    document.getElementById("money").innerText = money.toFixed(2);
    document.getElementById("efficiency").innerText = efficiency.toFixed(2);

    document.getElementById("voltage").innerText = data.voltage;
    document.getElementById("temperature").innerText = data.temperature;

    updateEfficiencyBar(efficiency);
    updateHealth(efficiency);
    checkFault(data.voltage, data.temperature);

    updateDetails(energy, co2, money, efficiency);
    generateChart(energy);
    loadHistory();
}

/* ================= Efficiency Bar ================= */

function updateEfficiencyBar(value) {

    const bar = document.getElementById("efficiencyBar");
    const percentage = value * 100;

    bar.style.width = percentage + "%";

    if (value > 0.7) {
        bar.style.background = "linear-gradient(90deg, #00ffcc, #00cc66)";
    } else if (value > 0.4) {
        bar.style.background = "linear-gradient(90deg, orange, yellow)";
    } else {
        bar.style.background = "linear-gradient(90deg, red, darkred)";
    }
}

/* ================= Health ================= */

function updateHealth(value) {
    const health = document.getElementById("healthMeter");

    health.innerText =
        value > 0.7 ? "✅ Optimal"
        : value > 0.4 ? "⚠ Moderate"
        : "❌ Low Performance";
}

/* ================= Fault Detection ================= */

function checkFault(voltage, temperature) {

    const alertBox = document.getElementById("alertBox");

    if (voltage < 210 || temperature > 60) {
        alertBox.innerText = "⚠️ Possible System Fault Detected!";
        alertBox.classList.add("show");

        setTimeout(() => {
            alertBox.classList.remove("show");
        }, 4000);
    }
}

/* ================= Details ================= */

function updateDetails(energy, co2, money, efficiency) {

    document.getElementById("energyDetails").innerHTML =
        `Energy = Power × Sunlight Hours.
         Current Power: ${latestData.currentPower} W.`;

    document.getElementById("co2Details").innerHTML =
        `CO₂ Saved = Energy × 0.85 factor.`;

    document.getElementById("moneyDetails").innerHTML =
        `Money Saved = Energy × ₹6 per unit.`;

    document.getElementById("efficiencyDetails").innerHTML =
        `Efficiency = Actual Energy / Maximum Possible.
         Current Value: ${efficiency.toFixed(2)}.`;

    document.getElementById("healthDetails").innerHTML =
        `Health depends on efficiency & hardware conditions.`;
}

function toggleDetails(id) {
    const element = document.getElementById(id);
    element.style.display =
        element.style.display === "block" ? "none" : "block";
}

/* ================= Charts ================= */

function generateChart(value) {

    const ctx = document.getElementById("energyChart").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
            datasets: [{
                label: "Energy Production",
                data: [
                    value*0.8,
                    value*0.9,
                    value,
                    value*0.95,
                    value*1.1,
                    value*1.05,
                    value
                ],
                borderColor: "#00ffcc",
                borderWidth: 3,
                tension: 0.4
            }]
        }
    });
}

/* ================= History ================= */

async function loadHistory() {

    const response = await fetch("/api/history");
    const data = await response.json();

    const labels = data.map(d => new Date(d.created_at).toLocaleTimeString());
    const values = data.map(d => d.dailyEnergy);

    const ctx = document.getElementById("historyChart").getContext("2d");

    if (historyChart) historyChart.destroy();

    historyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Historical Energy",
                data: values,
                backgroundColor: "#00ccff"
            }]
        }
    });
}

setInterval(fetchSolarData, 5000);
fetchSolarData();