import "dotenv/config";
import { connectToDatabase } from "../database/db";
import { User } from "../models/user.model";

async function updateMatchScore() {
  await connectToDatabase();
  console.log("Connected to database");

  // Update all users' minMatchScore to 40%
  const result = await User.updateMany(
    { "applyPolicy.minMatchScore": { $gte: 60 } },
    { $set: { "applyPolicy.minMatchScore": 40 } },
  );

  console.log(
    `✅ Updated ${result.modifiedCount} user(s) minMatchScore from 60% to 40%`,
  );

  process.exit(0);
}

updateMatchScore().catch((error) => {
  console.error("❌ Error updating match score:", error);
  process.exit(1);
});
