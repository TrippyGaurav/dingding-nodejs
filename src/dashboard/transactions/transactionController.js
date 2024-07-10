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
exports.TransactionController = void 0;
const userModel_1 = require("../users/userModel");
const transactionModel_1 = __importDefault(require("./transactionModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const transactionService_1 = __importDefault(require("./transactionService"));
class TransactionController {
    constructor() {
        this.transactionService = new transactionService_1.default();
        this.getTransactions = this.getTransactions.bind(this);
        this.getTransactionsBySubId = this.getTransactionsBySubId.bind(this);
        this.deleteTransaction = this.deleteTransaction.bind(this);
        this.getAllTransactions = this.getAllTransactions.bind(this);
    }
    /**
     * Creates a new transaction.
     */
    createTransaction(type, debtor, creditor, amount, session) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = yield this.transactionService.createTransaction(type, debtor, creditor, amount, session);
                console.log(`Transaction created: ${transaction._id}`);
                return transaction;
            }
            catch (error) {
                console.error(`Error creating transaction: ${error.message}`);
                throw error;
            }
        });
    }
    /**
     * Retrieves transactions for the authenticated user.
     */
    getTransactions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { username, role } = _req.user;
                const transactions = yield this.transactionService.getTransactions(username);
                res.status(200).json(transactions);
            }
            catch (error) {
                console.error(`Error fetching transactions: ${error.message}`);
                next(error);
            }
        });
    }
    /**
     * Retrieves transactions for a specific client.
     */
    getTransactionsBySubId(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { username, role } = _req.user;
                const { subordinateId } = req.params;
                const user = yield userModel_1.User.findOne({ username });
                const subordinate = yield userModel_1.User.findOne({ _id: subordinateId });
                if (!user) {
                    throw (0, http_errors_1.default)(404, "Unable to find logged in user");
                }
                if (!subordinate) {
                    throw (0, http_errors_1.default)(404, "User not found");
                }
                if (user.role === "company" || user.subordinates.includes(new mongoose_1.default.Types.ObjectId(subordinateId))) {
                    const transactions = yield this.transactionService.getTransactionsBySubName(subordinate.username);
                    res.status(200).json(transactions);
                }
                else {
                    throw (0, http_errors_1.default)(403, "Forbidden: You do not have the necessary permissions to access this resource.");
                }
            }
            catch (error) {
                console.error(`Error fetching transactions by client ID: ${error.message}`);
                next(error);
            }
        });
    }
    /**
     * Retrieves All transactions
     */
    getAllTransactions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { username, role } = _req.user;
                if (role != "company") {
                    throw (0, http_errors_1.default)(403, "Access denied. Only users with the role 'company' can access this resource.");
                }
                const transactions = yield transactionModel_1.default.find();
                res.status(200).json(transactions);
            }
            catch (error) {
                console.error(`Error fetching transactions by client ID: ${error.message}`);
                next(error);
            }
        });
    }
    /**
     * Deletes a transaction.
     */
    deleteTransaction(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                    throw (0, http_errors_1.default)(400, "Invalid transaction ID");
                }
                const deletedTransaction = yield this.transactionService.deleteTransaction(id, session);
                if (deletedTransaction instanceof mongoose_1.default.Query) {
                    const result = yield deletedTransaction.lean().exec();
                    if (!result) {
                        throw (0, http_errors_1.default)(404, "Transaction not found");
                    }
                    res.status(200).json({ message: "Transaction deleted successfully" });
                    console.log(`Transaction deleted: ${id}`);
                }
                else {
                    if (!deletedTransaction) {
                        throw (0, http_errors_1.default)(404, "Transaction not found");
                    }
                    res.status(200).json({ message: "Transaction deleted successfully" });
                    console.log(`Transaction deleted: ${id}`);
                }
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                console.error(`Error deleting transaction: ${error.message}`);
                next(error);
            }
        });
    }
}
exports.TransactionController = TransactionController;
