// import { Request, Response, NextFunction } from "express";
// import bcrypt from "bcrypt";
// import createHttpError from "http-errors";
// import { User } from "../users/userModel";

// class CompanyController {
//   async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { user } = req.body;

//       // Validate required fields
//       if (!this.validateUserFields(user)) {
//         throw createHttpError(400, "All required fields (name, username, password, role) must be provided");
//       }

//       const existingCompany = await this.findCompanyByUsername(user.username);
//       if (existingCompany) {
//         throw createHttpError(409, "Company already exists");
//       }

//       const hashedPassword = await this.hashPassword(user.password);

//       const company = await this.saveCompany({
//         name: user.name,
//         username: user.username,
//         password: hashedPassword,
//         role: user.role,
//         credits: Infinity, // Assign infinite credits
//       });

//       res.status(201).json(company);
//     } catch (error) {
//       next(error);
//     }
//   }

//   private validateUserFields(user: any): boolean {
//     return user && user.name && user.username && user.password && user.role;
//   }

//   private async findCompanyByUsername(username: string): Promise<typeof User | null> {
//     return User.findOne({ username });
//   }

//   private async hashPassword(password: string): Promise<string> {
//     return bcrypt.hash(password, 10);
//   }

//   private async saveCompany(userData: any): Promise<typeof User> {
//     const company = new User(userData);
//     return company.save();
//   }
// }

// export default new CompanyController();
