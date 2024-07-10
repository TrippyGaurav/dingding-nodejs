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
exports.getSubordinateModel = exports.uploadImage = exports.updateCredits = exports.updatePassword = exports.updateStatus = exports.MESSAGEID = exports.rolesHierarchy = exports.clients = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const transactionController_1 = require("../dashboard/transactions/transactionController");
const cloudinary_1 = require("cloudinary");
const config_1 = require("../config/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const transactionController = new transactionController_1.TransactionController();
exports.clients = new Map();
exports.rolesHierarchy = {
    company: ["master", "distributor", "subdistributor", "store", "player"],
    master: ["distributor"],
    distributor: ["subdistributor"],
    subdistributor: ["store"],
    store: ["player"],
};
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloud_name,
    api_key: config_1.config.api_key,
    api_secret: config_1.config.api_secret,
});
var MESSAGEID;
(function (MESSAGEID) {
    MESSAGEID["AUTH"] = "AUTH";
    MESSAGEID["SPIN"] = "SPIN";
    MESSAGEID["GAMBLE"] = "GAMBLE";
    MESSAGEID["GENRTP"] = "GENRTP";
})(MESSAGEID || (exports.MESSAGEID = MESSAGEID = {}));
const updateStatus = (client, status) => {
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status)) {
        throw (0, http_errors_1.default)(400, "Invalid status value");
    }
    client.status = status;
};
exports.updateStatus = updateStatus;
const updatePassword = (client, password, existingPassword) => __awaiter(void 0, void 0, void 0, function* () {
    if (!existingPassword) {
        throw (0, http_errors_1.default)(400, "Existing password is required to update the password");
    }
    // Check if existingPassword matches client's current password
    const isPasswordValid = yield bcrypt_1.default.compare(existingPassword, client.password);
    if (!isPasswordValid) {
        throw (0, http_errors_1.default)(400, "Existing password is incorrect");
    }
    // Update password
    client.password = yield bcrypt_1.default.hash(password, 10);
});
exports.updatePassword = updatePassword;
const updateCredits = (client, creator, credits) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { type, amount } = credits;
        // Validate credits
        if (!type ||
            typeof amount !== "number" ||
            !["recharge", "redeem"].includes(type)) {
            throw (0, http_errors_1.default)(400, "Credits must include a valid type ('recharge' or 'redeem') and a numeric amount");
        }
        const transaction = yield transactionController.createTransaction(type, creator, client, amount, session);
        // Add the transaction to both users' transactions arrays
        client.transactions.push(transaction._id);
        creator.transactions.push(transaction._id);
        yield client.save({ session });
        yield creator.save({ session });
        yield session.commitTransaction();
        session.endSession();
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
exports.updateCredits = updateCredits;
const uploadImage = (image) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload(image, { folder: "casinoGames" }, (error, result) => {
            if (result && result.secure_url) {
                // console.log(result.secure_url);
                return resolve(result.secure_url);
            }
            console.log(error.message);
            return reject({ message: error.message });
        });
    });
};
exports.uploadImage = uploadImage;
const getSubordinateModel = (role) => {
    const rolesHierarchy = {
        company: "User",
        master: "User",
        distributor: "User",
        subdistributor: "User",
        store: "Player",
    };
    return rolesHierarchy[role];
};
exports.getSubordinateModel = getSubordinateModel;
