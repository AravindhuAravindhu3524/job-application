//import { builtinModules } from "module";

// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");

// Create the app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Setup
mongoose.connect("mongodb://127.0.0.1:27017/job-application")
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Models
const Job = mongoose.model(
    "Job",
    new mongoose.Schema({
        title: { type: String, required: true },
        company: { type: String, required: true },
        description: { type: String, required: true },
        deadline: { type: Date, required: true },
    })
);

const Application = mongoose.model(
    "Application",
    new mongoose.Schema({
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        resume: { type: String, required: true },
        coverLetter: { type: String, required: true },
    })
);

// Multer for file uploads
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Backend Routes

// Get all jobs
app.get("/api/jobs", async (req, res) => {
    try {
        const jobs = await Job.find();
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});

// Get job details
app.get("/api/jobs/:id", async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch job details" });
    }
});

// Post a new job
app.post("/api/jobs", async (req, res) => {
    try {
        const { title, company, description, deadline } = req.body;
        const newJob = new Job({ title, company, description, deadline });
        await newJob.save();
        res.status(201).json(newJob);
    } catch (err) {
        res.status(500).json({ error: "Failed to create job" });
    }
});

// Submit an application
app.post("/api/applications", upload.single("resume"), async (req, res) => {
    try {
        const { jobId, name, email, phone, coverLetter } = req.body;
        const newApplication = new Application({
            jobId,
            name,
            email,
            phone,
            resume: req.file.path,
            coverLetter,
        });
        await newApplication.save();
        res.status(201).json(newApplication);
    } catch (err) {
        res.status(500).json({ error: "Failed to submit application" });
    }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend/build")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
});

// Start server
//const PORT = process.env.PORT ||5000;
app.listen(3000, () => console.log(`Server running on port 3000`));
module.exports = app
