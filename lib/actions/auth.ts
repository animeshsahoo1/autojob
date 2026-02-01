"use server";

import { User } from "@/models/user.model";
import { hash } from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { connectToDatabase } from "@/database/db";

export interface AuthCredentials {
  userName: string;
  email: string;
  password: string;
}

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">,
) => {
  const { email, password } = params;

  try {
    await connectToDatabase();
    console.log("Connected to database");

    // Check if user exists with Google provider
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.provider === "google") {
      return {
        success: false,
        error:
          "This email is registered with Google. Please use Google Sign In.",
      };
    }
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.log(error, "Signin error");
    return { success: false, error: "Signin error" };
  }
};

export const signUp = async (params: AuthCredentials) => {
  const { userName, email, password } = params;

  await connectToDatabase();
  console.log("Connected to database");
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.provider === "google") {
      return {
        success: false,
        error:
          "This email is registered with Google. Please use Google Sign In.",
      };
    }
    return { success: false, error: "User already exists" };
  }

  const hashedPassword = await hash(password, 10);
  console.log("hashedPassword: ", hashedPassword);

  try {
    await User.create({
      userName,
      email,
      password: hashedPassword,
      provider: "credentials",
    });

    await signInWithCredentials({ email, password });

    return { success: true };
  } catch (error) {
    console.log(error, "Signup error");
    return { success: false, error: (error as Error).message };
  }
};

export async function logout() {
  await signOut({ redirectTo: "/" });
}
