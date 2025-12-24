"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const User_1 = require("../models/User");
const ScanResult_1 = require("../models/ScanResult");
const EmailService_1 = require("../services/EmailService");
dotenv_1.default.config();
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.connectDB)();
    const users = yield User_1.User.find({});
    for (const user of users) {
        // Get last month's results
        const results = yield ScanResult_1.ScanResult.find({
            userId: user._id,
            status: { $in: ['zombie', 'downgrade_possible'] }
        });
        if (results.length > 0) {
            const totalSavings = results.reduce((acc, r) => acc + (r.potentialSavings || 0), 0);
            const digestResults = results.map(result => ({
                resourceName: result.resourceName,
                reason: result.reason,
                potentialSavings: result.potentialSavings || 0,
            }));
            yield EmailService_1.EmailService.sendMonthlyDigest(user.email, totalSavings, digestResults);
            console.log(`Sent digest to ${user.email}`);
        }
    }
    console.log('Digest sending complete');
    process.exit(0);
});
run().catch(err => {
    console.error(err);
    process.exit(1);
});
