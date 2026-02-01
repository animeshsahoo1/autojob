import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { User } from "@/models/user.model";
import { connectToDatabase } from "@/database/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email }).select(
      "applyPolicy",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ applyPolicy: user.applyPolicy || {} });
  } catch (error) {
    console.error("Error fetching apply policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { applyPolicy } = body;

    if (!applyPolicy) {
      return NextResponse.json(
        { error: "Apply policy data required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    console.log("[ApplyPolicy API] Updating policy for:", session.user.email);
    console.log(
      "[ApplyPolicy API] New policy:",
      JSON.stringify(applyPolicy, null, 2),
    );

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { applyPolicy } },
      { new: true, runValidators: true },
    ).select("applyPolicy");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(
      "[ApplyPolicy API] Updated successfully:",
      JSON.stringify(user.applyPolicy, null, 2),
    );

    return NextResponse.json({
      message: "Apply policy updated successfully",
      applyPolicy: user.applyPolicy,
    });
  } catch (error) {
    console.error("Error updating apply policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
