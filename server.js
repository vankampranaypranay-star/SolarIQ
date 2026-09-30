const axios = require("axios");
const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const PORT = 3000;

/* -------------------------
   MIDDLEWARE
-------------------------- */

app.use(express.json());

app.use(session({
    secret: "solariq_secret",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(__dirname, { index: false }));
app.get("/", (req, res) => {
    if (req.session.user) {
        res.redirect("/dashboard.html");
    } else {
        res.redirect("/login.html");
    }
});

/* -------------------------
   DATABASE CONNECTION
-------------------------- */

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "solariq"
});

db.connect(err => {
    if (err) throw err;
    console.log("✅ Connected to MySQL");
});

/* -------------------------
   AUTH MIDDLEWARE
-------------------------- */

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login.html");
    }
    next();
}

/* -------------------------
   ROUTES
-------------------------- */

// Redirect root
app.get("/", (req, res) => {
    if (req.session.user) {
        res.redirect("/dashboard.html");
    } else {
        res.redirect("/login.html");
    }
});

// Protect dashboard
app.get("/dashboard.html", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Solar Data API (Protected)
app.get("/api/solar-data", requireLogin, (req, res) => {

    const currentPower = Math.floor(Math.random() * 1500 + 500);
    const dailyEnergy = (currentPower / 1000 * 6).toFixed(2);
    const voltage = (220 + Math.random() * 10).toFixed(1);
    const temperature = (35 + Math.random() * 10).toFixed(1);

    const sql = `
        INSERT INTO solar_logs 
        (currentPower, dailyEnergy, voltage, temperature) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [currentPower, dailyEnergy, voltage, temperature]);

    res.json({
        currentPower,
        dailyEnergy,
        voltage,
        temperature
    });
});
//const axios = require("axios");

//app.get("/api/solar-data", async (req, res) => {

  //  const inverterData = await axios.get("http://192.168.1.50/data");

    //res.json(inverterData.data);
//});
// History API (Protected)
app.get("/api/history", requireLogin, (req, res) => {
    db.query(
        "SELECT * FROM solar_logs ORDER BY created_at DESC LIMIT 20",
        (err, results) => {
            if (err) throw err;
            res.json(results);
        }
    );
});

// Register
app.post("/register", async (req, res) => {

    const { username, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hashed],
        (err) => {

            if (err) {
                return res.json({ message: "User already exists" });
            }

            return res.json({ message: "REGISTER_SUCCESS" });
        }
    );
});

// Login
app.post("/login", (req, res) => {

    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, results) => {

            if (err) {
                return res.json({ message: "Server error" });
            }

            if (results.length === 0) {
                return res.json({ message: "User not found" });
            }

            const match = await bcrypt.compare(password, results[0].password);

            if (!match) {
                return res.json({ message: "Wrong password" });
            }

            req.session.user = username;

            return res.json({ message: "LOGIN_SUCCESS" });
        }
    );
});
// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});
app.get("/api/weather", async (req, res) => {
    try {
        const city = "Hyderabad";
        const API_KEY = "2c8acddb0ceff0c03837c2c6963cf3db";

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );

        res.json(response.data);

    } catch (err) {
        console.log("Weather API ERROR:");
        console.log(err.response?.data || err.message);

        res.status(500).json({ error: "Weather fetch failed" });
    }
});

app.get("/api/predict", async (req, res) => {
    try {
        const API_KEY = "45178b01503444f79d3174106262002";  // 🔥 Replace this
        const city = "Hyderabad";

        const weatherRes = await axios.get(
            `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=2`
        );

        const tomorrow = weatherRes.data.forecast.forecastday[1];

        const weatherText = tomorrow.day.condition.text;
        const rainChance = tomorrow.day.daily_chance_of_rain;

        let weatherFactor = 1;
        let weatherType = "Sunny";

        if (rainChance > 60) {
            weatherFactor = 0.6;
            weatherType = "Rainy";
        } 
        else if (rainChance > 30) {
            weatherFactor = 0.8;
            weatherType = "Cloudy";
        }

        const capacity = 5; // kW
        const baseEfficiency = 0.85;
        const sunlightHours = 6;

        const predictedEnergy =
            capacity * sunlightHours * weatherFactor * baseEfficiency;

        const predictedEfficiency =
            (weatherFactor * baseEfficiency).toFixed(2);

        res.json({
            weather: weatherText,
            predictedEnergy: predictedEnergy.toFixed(2),
            predictedEfficiency,
            rainProbability: rainChance,
            weatherFactor
        });

    } catch (err) {
        console.log("WeatherAPI Error:", err.response?.data || err.message);
        res.status(500).json({ error: "Prediction failed" });
    }
});

app.get("/api/monthly-forecast", async (req, res) => {

    const efficiency = 0.85;
    const capacity = 5;
    const sunlightHours = 6;

    const baseDaily = capacity * sunlightHours * efficiency;
    const monthly = baseDaily * 30;

    res.json({
        monthlyProjectedEnergy: monthly.toFixed(2),
        estimatedCO2Saved: (monthly * 0.85).toFixed(2),
        estimatedRevenue: (monthly * 6).toFixed(2)
    });
});
/* -------------------------
   START SERVER
-------------------------- */

app.listen(PORT, () => {
    console.log(`🚀 SolarIQ running at http://localhost:${PORT}`);
});
app.get("/api/predict", (req, res) => {

    const weatherOptions = ["Sunny", "Cloudy", "Rainy"];
    const weather = weatherOptions[Math.floor(Math.random() * 3)];

    let baseEnergy = 8;

    if (weather === "Sunny") baseEnergy = 8 + Math.random() * 2;
    if (weather === "Cloudy") baseEnergy = 5 + Math.random() * 1.5;
    if (weather === "Rainy") baseEnergy = 3 + Math.random();

    const predictedEnergy = baseEnergy.toFixed(2);
    const predictedEfficiency = Math.min(1, predictedEnergy / 9).toFixed(2);

    res.json({
    predictedEnergy: predictedEnergy.toFixed(2),
    rainProbability: rainProb,      // EXACT NAME
    weatherFactor: weatherFactor,  // EXACT NAME
    efficiency: efficiency         // EXACT NAME