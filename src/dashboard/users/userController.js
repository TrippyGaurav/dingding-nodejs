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
exports.UserController = void 0;
const utils_1 = require("../../utils/utils");
const http_errors_1 = __importDefault(require("http-errors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
const userModel_1 = require("./userModel");
const userService_1 = __importDefault(require("./userService"));
const transactionModel_1 = __importDefault(require("../transactions/transactionModel"));
class UserController {
    constructor() {
        this.userService = new userService_1.default();
        this.loginUser = this.loginUser.bind(this);
        this.createUser = this.createUser.bind(this);
        this.getCurrentUser = this.getCurrentUser.bind(this);
        this.getAllSubordinates = this.getAllSubordinates.bind(this);
        this.getSubordinateById = this.getSubordinateById.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.updateClient = this.updateClient.bind(this);
        this.getReport = this.getReport.bind(this);
        this.getASubordinateReport = this.getASubordinateReport.bind(this);
        // this.getUserSubordinates = this.getUserSubordinates.bind(this);
    }
    static getSubordinateRoles(role) {
        return this.rolesHierarchy[role] || [];
    }
    static isRoleValid(role, subordinateRole) {
        return this.getSubordinateRoles(role).includes(subordinateRole);
    }
    static getStartAndEndOfPeriod(type) {
        const start = new Date();
        const end = new Date();
        switch (type) {
            case 'weekly':
                start.setDate(start.getDate() - start.getDay()); // set to start of the week
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() + (6 - end.getDay())); // set to end of the week
                end.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                start.setDate(1); // set to start of the month
                start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0); // set to end of the month
                end.setHours(23, 59, 59, 999);
                break;
            case 'daily':
            default:
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
        }
        return { start, end };
    }
    loginUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                console.log("Login Request : ", username, password);
                if (!username || !password) {
                    throw (0, http_errors_1.default)(400, "Username, password are required");
                }
                let user;
                user = yield this.userService.findUserByUsername(username);
                if (!user) {
                    user = yield this.userService.findPlayerByUsername(username);
                    if (!user) {
                        throw (0, http_errors_1.default)(401, "User not found");
                    }
                }
                console.log("Logged : ", user);
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    throw (0, http_errors_1.default)(401, "Invalid username or password");
                }
                user.lastLogin = new Date();
                user.loginTimes = (user.loginTimes || 0) + 1;
                yield user.save();
                const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username, role: user.role }, config_1.config.jwtSecret, { expiresIn: "24h" });
                res.cookie("userToken", token, {
                    maxAge: 1000 * 60 * 60 * 24 * 7,
                    httpOnly: true,
                    sameSite: "none",
                });
                res.status(200).json({
                    message: "Login successful",
                    token: token,
                    role: user.role
                });
            }
            catch (error) {
                console.log(error);
                next(error);
            }
        });
    }
    createUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const _req = req;
                const { user } = req.body;
                const { username, role } = _req.user; // ADMIN
                if (!user || !user.name || !user.username || !user.password || !user.role || user.credits === undefined) {
                    throw (0, http_errors_1.default)(400, "All required fields must be provided");
                }
                if (role !== "company" && !UserController.isRoleValid(role, user.role)) {
                    throw (0, http_errors_1.default)(403, `A ${role} cannot create a ${user.role}`);
                }
                const admin = yield this.userService.findUserByUsername(username, session);
                if (!admin) {
                    throw (0, http_errors_1.default)(404, "Admin not found");
                }
                let existingUser = user.role === "player" ? yield this.userService.findPlayerByUsername(user.username, session) : yield this.userService.findUserByUsername(user.username, session);
                if (existingUser) {
                    throw (0, http_errors_1.default)(409, "User already exists");
                }
                const hashedPassword = yield bcrypt_1.default.hash(user.password, 10);
                let newUser;
                if (user.role === "player") {
                    newUser = yield this.userService.createPlayer(Object.assign(Object.assign({}, user), { createdBy: admin._id }), 0, hashedPassword, session);
                }
                else {
                    newUser = yield this.userService.createUser(Object.assign(Object.assign({}, user), { createdBy: admin._id }), 0, hashedPassword, session);
                }
                if (user.credits > 0) {
                    const transaction = yield this.userService.createTransaction("recharge", admin, newUser, user.credits, session);
                    newUser.transactions.push(transaction._id);
                    admin.transactions.push(transaction._id);
                }
                yield newUser.save({ session });
                admin.subordinates.push(newUser._id);
                yield admin.save({ session });
                yield session.commitTransaction();
                res.status(201).json(newUser);
            }
            catch (error) {
                next(error);
            }
            finally {
                session.endSession();
            }
        });
    }
    getCurrentUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { username, role } = _req.user;
                // throw createHttpError(404, "Access Denied")`
                let user;
                if (role === "player") {
                    user = yield this.userService.findPlayerByUsername(username);
                }
                else {
                    user = yield this.userService.findUserByUsername(username);
                }
                if (!user) {
                    throw (0, http_errors_1.default)(404, "User not found");
                }
                res.status(200).json(user);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllSubordinates(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { username: loggedUserName, role: loggedUserRole } = _req.user;
                const loggedUser = yield this.userService.findUserByUsername(loggedUserName);
                if (!loggedUser) {
                    throw (0, http_errors_1.default)(404, "User not found");
                }
                if (loggedUser.role !== "company") {
                    throw (0, http_errors_1.default)(403, "Access denied. Only users with the role 'company' can access this resource.");
                }
                const users = yield userModel_1.User.find({ role: { $ne: "company" } });
                const players = yield userModel_1.Player.find({});
                const allSubordinates = [...users, ...players];
                // let userWithSubordinates;
                // if(loggedUser.role === "store"){
                //   userWithSubordinates = await User.findById(loggedUser._id).populate({path:"subordinates", model:Player});
                // }
                // else{
                //   userWithSubordinates = await User.findById(loggedUser._id).populate({path:"subordinates", model:User});
                // }
                res.status(200).json(allSubordinates);
            }
            catch (error) {
                next(error);
            }
        });
    }
    deleteUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { username, role } = _req.user;
                const { clientId } = req.params;
                if (!clientId) {
                    throw (0, http_errors_1.default)(400, "Client Id is required");
                }
                const clientObjectId = new mongoose_1.default.Types.ObjectId(clientId);
                const admin = yield this.userService.findUserByUsername(username);
                if (!admin) {
                    throw (0, http_errors_1.default)(404, "Admin Not Found");
                }
                const client = (yield this.userService.findUserById(clientObjectId)) || (yield this.userService.findPlayerById(clientObjectId));
                if (!client) {
                    throw (0, http_errors_1.default)(404, "User not found");
                }
                if (role != "company" && !admin.subordinates.some((id) => id.equals(clientObjectId))) {
                    throw (0, http_errors_1.default)(403, "Client does not belong to the creator");
                }
                const clientRole = client.role;
                if (!UserController.rolesHierarchy[role] ||
                    !UserController.rolesHierarchy[role].includes(clientRole)) {
                    throw (0, http_errors_1.default)(403, `A ${role} cannot delete a ${clientRole}`);
                }
                if (client instanceof userModel_1.User) {
                    yield this.userService.deleteUserById(clientObjectId);
                }
                else if (client instanceof userModel_1.Player) {
                    yield this.userService.deletePlayerById(clientObjectId);
                }
                admin.subordinates = admin.subordinates.filter((id) => !id.equals(clientObjectId));
                yield admin.save();
                res.status(200).json({ message: "Client deleted successfully" });
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateClient(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { username, role } = _req.user;
                const { clientId } = req.params;
                const { status, credits, password, existingPassword } = req.body;
                console.log("Upadating for : ", clientId);
                if (!clientId) {
                    throw (0, http_errors_1.default)(400, "Client Id is required");
                }
                const clientObjectId = new mongoose_1.default.Types.ObjectId(clientId);
                let admin;
                admin = yield this.userService.findUserByUsername(username);
                if (!admin) {
                    admin = yield this.userService.findPlayerByUsername(username);
                    if (!admin) {
                        throw (0, http_errors_1.default)(404, "Creator not found");
                    }
                }
                const client = (yield this.userService.findUserById(clientObjectId)) || (yield this.userService.findPlayerById(clientObjectId));
                if (!client) {
                    throw (0, http_errors_1.default)(404, "Client not found");
                }
                // if (role != "company" && !admin.subordinates.some((id) => id.equals(clientObjectId))) {
                //   throw createHttpError(403, "Client does not belong to the creator");
                // }
                if (status) {
                    (0, utils_1.updateStatus)(client, status);
                }
                if (password) {
                    yield (0, utils_1.updatePassword)(client, password, existingPassword);
                }
                if (credits) {
                    credits.amount = Number(credits.amount);
                    yield (0, utils_1.updateCredits)(client, admin, credits);
                }
                yield admin.save();
                yield client.save();
                res.status(200).json({ message: "Client updated successfully", client });
            }
            catch (error) {
                console.log("Error in updating : ", error);
                next(error);
            }
        });
    }
    getSubordinateById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { subordinateId } = req.params;
                const { username: loggedUserName, role: loggedUserRole } = _req.user;
                console.log(loggedUserName, loggedUserRole);
                const subordinateObjectId = new mongoose_1.default.Types.ObjectId(subordinateId);
                const loggedUser = yield this.userService.findUserByUsername(loggedUserName);
                let user;
                user = yield this.userService.findUserById(subordinateObjectId);
                if (!user) {
                    user = yield this.userService.findPlayerById(subordinateObjectId);
                    if (!user) {
                        throw (0, http_errors_1.default)(404, "User not found");
                    }
                }
                if (loggedUserRole === "company" || loggedUser.subordinates.includes(subordinateObjectId) || user._id.toString() == loggedUser._id.toString()) {
                    let client;
                    switch (user.role) {
                        case "company":
                            client = yield userModel_1.User.findById(subordinateId).populate({ path: "transactions", model: transactionModel_1.default });
                            const userSubordinates = yield userModel_1.User.find({ createdBy: subordinateId });
                            const playerSubordinates = yield userModel_1.Player.find({ createdBy: subordinateId });
                            console.log("userSubordinates", userSubordinates);
                            console.log("playerSubordinates", playerSubordinates);
                            client = client.toObject(); // Convert Mongoose Document to plain JavaScript object
                            client.subordinates = [...userSubordinates, ...playerSubordinates];
                            console.log("client", client.subordinates);
                            break;
                        case "store":
                            client = yield userModel_1.User.findById(subordinateId).populate({ path: "subordinates", model: userModel_1.Player }).populate({ path: "transactions", model: transactionModel_1.default });
                            break;
                        case "player":
                            client = user;
                            break;
                        default:
                            client = yield userModel_1.User.findById(subordinateObjectId).populate({ path: "transactions", model: transactionModel_1.default, }).populate({ path: "subordinates", model: userModel_1.User });
                    }
                    if (!client) {
                        throw (0, http_errors_1.default)(404, "Client not found");
                    }
                    res.status(200).json(client);
                }
                else {
                    throw (0, http_errors_1.default)(403, "Forbidden: You do not have the necessary permissions to access this resource.");
                }
            }
            catch (error) {
                next(error);
            }
        });
    }
    getReport(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { role } = _req.user;
                const { type } = req.query;
                if (role !== 'company') {
                    throw (0, http_errors_1.default)(403, 'Access denied: You do not have permission to access this resource.');
                }
                const { start, end } = UserController.getStartAndEndOfPeriod(type);
                // Fetch today's transactions
                const transactionsToday = yield transactionModel_1.default.find({
                    createdAt: { $gte: start, $lte: end },
                }).sort({ createdAt: -1 });
                // Aggregate the total money spent today
                const totalMoneySpentToday = transactionsToday.reduce((sum, t) => sum + t.amount, 0);
                // Fetch users and players created today
                const usersCreatedToday = yield userModel_1.User.find({
                    createdAt: { $gte: start, $lte: end },
                }).sort({ createdAt: -1 });
                const playersCreatedToday = yield userModel_1.Player.find({
                    createdAt: { $gte: start, $lte: end },
                }).sort({ createdAt: -1 });
                // Prepare the report
                const report = {
                    spent: totalMoneySpentToday,
                    users: usersCreatedToday,
                    players: playersCreatedToday,
                    transactions: transactionsToday,
                };
                res.status(200).json(report);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getASubordinateReport(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { username: loggedUsername, role: loggedUserRole } = _req.user;
                const { subordinateId } = req.params;
                const { type } = req.query;
                const { start, end } = UserController.getStartAndEndOfPeriod(type);
                const subordinateObjectId = new mongoose_1.default.Types.ObjectId(subordinateId);
                // Fetch subordinate details
                let subordinate = yield userModel_1.User.findById(subordinateObjectId);
                if (!subordinate) {
                    subordinate = yield userModel_1.Player.findById(subordinateObjectId);
                    if (!subordinate) {
                        throw (0, http_errors_1.default)(404, "Subordinate not found");
                    }
                }
                // Fetch today's transactions where the subordinate is the creditor
                const transactionsTodayAsCreditor = yield transactionModel_1.default.find({
                    creditor: subordinate.username,
                    createdAt: { $gte: start, $lte: end }
                });
                // Aggregate the total credits given to the subordinate today
                const totalCreditsGivenToday = transactionsTodayAsCreditor.reduce((sum, t) => sum + t.amount, 0);
                // Fetch today's transactions where the subordinate is the debtor
                const transactionsTodayAsDebtor = yield transactionModel_1.default.find({
                    debtor: subordinate.username,
                    createdAt: { $gte: start, $lte: end }
                });
                // Aggregate the total money spent by the subordinate today
                const totalMoneySpentToday = transactionsTodayAsDebtor.reduce((sum, t) => sum + t.amount, 0);
                // Combine both sets of transactions
                const allTransactions = [...transactionsTodayAsCreditor, ...transactionsTodayAsDebtor];
                // Fetch users and players created by this subordinate today
                const usersCreatedToday = yield userModel_1.User.find({
                    createdBy: subordinate._id,
                    createdAt: { $gte: start, $lte: end }
                });
                const playersCreatedToday = yield userModel_1.Player.find({
                    createdBy: subordinate._id,
                    createdAt: { $gte: start, $lte: end }
                });
                const report = {
                    creditsGiven: totalCreditsGivenToday,
                    moneySpent: totalMoneySpentToday,
                    transactions: allTransactions, // All transactions related to the subordinate
                    users: usersCreatedToday,
                    players: playersCreatedToday
                };
                console.log(report);
                res.status(200).json(report);
            }
            catch (error) {
                console.log(error);
                next(error);
            }
        });
    }
}
exports.UserController = UserController;
UserController.rolesHierarchy = {
    company: ["master", "distributor", "subdistributor", "store", "player"],
    master: ["distributor"],
    distributor: ["subdistributor"],
    subdistributor: ["store"],
    store: ["player"],
};
