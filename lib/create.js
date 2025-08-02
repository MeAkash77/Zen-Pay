"use server";
import { Trans } from "@/models/trans";
import { User } from "@/models/user";
import { connectToDb } from "@/mongodb/connect";
import { disconnectFromDb } from "@/mongodb/disconnect";
import { currentUser } from "@clerk/nextjs";

// Create user account if not exists
export const CreateAccount = async () => {
  const user = await currentUser();
  const email = user.emailAddresses[0].emailAddress;
  const userId = user.id; // ✅ Clerk User ID
  const zpi = email.split("@")[0] + "@zpi";

  await connectToDb();
  const findAcc = await User.findOne({ email });

  if (findAcc) {
    return {
      email: findAcc.email,
      zpi: findAcc.zpi,
      balance: findAcc.balance,
    };
  }

  try {
    const account = await User.create({
      id: userId, // ✅ Add this line to fix duplicate key error
      email,
      zpi,
      balance: 250,
    });
    return {
      email: account.email,
      zpi: account.zpi,
      balance: account.balance,
    };
  } catch (err) {
    console.error("Account creation error:", err);
    return { email: null, zpi: null, balance: null };
  }
};

// Make transaction to another user
export const makeTrans = async (zpi, amount) => {
  const curruser = await currentUser();
  const email = curruser.emailAddresses[0].emailAddress;

  await connectToDb();
  const toUser = await User.findOne({ zpi });
  const fromUser = await User.findOne({ email });

  const amountT = parseInt(amount);
  if (!fromUser) {
    return { error: "Sender account not found." };
  }
  if (fromUser.balance < amountT) {
    return { error: "Insufficient balance." };
  }
  if (fromUser.zpi === zpi) {
    return { error: "Cannot pay yourself." };
  }
  if (!toUser) {
    return { error: "Invalid ZPI ID." };
  }

  try {
    await createHist(amountT, fromUser.zpi, toUser.zpi);
    toUser.balance += amountT;
    fromUser.balance -= amountT;

    await toUser.save();
    await fromUser.save();

    return { success: true };
  } catch (err) {
    console.error("Transaction error:", err);
    return { error: err.message };
  }
};

// Create a transaction record
export const createHist = async (amount, from, to) => {
  await connectToDb();
  try {
    await Trans.create({ amount, from, to });
    return { success: true };
  } catch (err) {
    console.error("History creation error:", err);
    return { error: err.message };
  }
};

// Get received transaction history
export const getHist = async () => {
  const user = await currentUser();
  const email = user.emailAddresses[0].emailAddress;

  await connectToDb();
  const userDoc = await User.findOne({ email });

  if (!userDoc) {
    throw new Error(`User not found for email: ${email}`);
  }

  return await Trans.find({ to: userDoc.zpi });
};

// Get sent transaction history
export const getFromHist = async () => {
  const user = await currentUser();
  const email = user.emailAddresses[0].emailAddress;

  await connectToDb();
  const userDoc = await User.findOne({ email });

  if (!userDoc) {
    throw new Error(`User not found for email: ${email}`);
  }

  return await Trans.find({ from: userDoc.zpi });
};
