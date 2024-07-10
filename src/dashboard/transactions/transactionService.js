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
exports.TransactionService = void 0;
const utils_1 = require("../../utils/utils");
const http_errors_1 = __importDefault(require("http-errors"));
const transactionModel_1 = __importDefault(require("./transactionModel"));
const userModel_1 = require("../users/userModel");
class TransactionService {
    createTransaction(type, manager, client, amount, session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = utils_1.rolesHierarchy[manager.role]) === null || _a === void 0 ? void 0 : _a.includes(client.role))) {
                throw (0, http_errors_1.default)(403, `${manager.role} cannot perform transactions with ${client.role}`);
            }
            if (type === "recharge") {
                if (manager.credits < amount) {
                    throw (0, http_errors_1.default)(400, "Insufficient credits to recharge");
                }
                client.credits += amount;
                client.totalRecharged += amount;
                manager.credits -= amount;
            }
            else if (type === "redeem") {
                if (client.credits < amount) {
                    throw (0, http_errors_1.default)(400, "Client has insufficient credits to redeem");
                }
                client.credits -= amount;
                client.totalRedeemed += amount;
                manager.credits += amount;
            }
            const transaction = new transactionModel_1.default({
                debtor: type === "recharge" ? manager.username : client.username,
                creditor: type === "recharge" ? client.username : manager.username,
                type: type,
                amount: amount,
                createdAt: new Date(),
            });
            yield transaction.save({ session });
            return transaction;
        });
    }
    getTransactions(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield userModel_1.User.findOne({ username });
            const transactions = yield transactionModel_1.default.find({ $or: [{ debtor: user.username }, { creditor: user.username }] });
            return transactions;
        });
    }
    getTransactionsBySubName(subordinateName) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield transactionModel_1.default.find({ $or: [{ debtor: subordinateName }, { creditor: subordinateName }] });
            return transactions;
        });
    }
    deleteTransaction(id, session) {
        return transactionModel_1.default.findByIdAndDelete(id).session(session);
    }
}
exports.TransactionService = TransactionService;
exports.default = TransactionService;
