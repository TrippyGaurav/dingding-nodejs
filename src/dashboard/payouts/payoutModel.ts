import mongoose, { Schema } from "mongoose";

const PayoutsSchema = new Schema(
    {
        gameName: {
            type: String,
            required: true,
            unique: true
        },
        content: [
            {
                name: {
                    type: String,
                    required: true,
                    unique: true
                },
                data: [{
                    type: Schema.Types.Mixed,
                    required: true
                }]
            }
        ]
    },
    { timestamps: true }
)

const Payouts = mongoose.model("Payouts", PayoutsSchema);
export default Payouts;