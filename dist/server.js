"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const upload_1 = __importDefault(require("./routes/upload"));
const tutor_1 = __importDefault(require("./routes/tutor"));
const request_1 = __importDefault(require("./routes/request"));
const favorite_1 = __importDefault(require("./routes/favorite"));
const review_1 = __importDefault(require("./routes/review"));
const matching_1 = __importDefault(require("./routes/matching"));
const profile_1 = __importDefault(require("./routes/profile"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const meeting_1 = __importDefault(require("./routes/meeting"));
const initializeBadge_1 = require("./scripts/initializeBadge");
const database_1 = require("./database");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: ["http://localhost:3000","https://learnbridge-dep-01.vercel.app"], credentials: true }));
app.use(express_1.default.json());
//routes
app.use("/api/auth", auth_1.default);
app.use("/api/upload", upload_1.default);
app.use("/api/tutor", tutor_1.default);
app.use("/api/request", request_1.default);
app.use("/api/favorites", favorite_1.default);
app.use("/api/reviews", review_1.default);
app.use("/api/matching", matching_1.default);
app.use("/api/profile", profile_1.default);
app.use("/api/analytics", analytics_1.default);
app.use("/api/meetings", meeting_1.default);
const port = process.env.PORT || 5000;
async function startServer() {
    try {
        await (0, database_1.connectDB)();
        await (0, initializeBadge_1.initializeDefaultBadges)();
        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });
    }
    catch (err) {
        console.error("❌ Failed to start server:", err);
    }
}
startServer();
//# sourceMappingURL=server.js.map