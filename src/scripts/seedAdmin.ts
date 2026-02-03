import User from "../model/user.model.js";
import bcrypt from "bcryptjs";

export const seedAdminUser = async () => {
  try {
    const adminEmail = "rohitkolk@gmail.com";
    const adminPassword = "Rohit1300"; // The initial hardcoded password

    // 1. Check if this specific admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log("⚡ Admin user not found. Seeding now...");

      // 2. Encrypt the password (NEVER store plain text)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // 3. Create the Admin User
      await User.create({
        name: "Rayan Admin",
        email: adminEmail,
        password: hashedPassword, // Store the hash
        role: "admin",
      });

      console.log(`✅ Admin created successfully: ${adminEmail}`);
    } else {
      console.log("ℹ️ Admin user already exists. Skipping seed.");
    }
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
  }
};
