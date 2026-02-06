import User from "../model/user.model.js";
import bcrypt from "bcryptjs";

// Track if admin seeding has been attempted in this serverless instance
let adminSeeded = false;

const seedAdminUser = async () => {
  // Prevent multiple seeding attempts in the same serverless instance
  if (adminSeeded) {
    console.log("ℹ️ Admin seeding already attempted in this instance");
    return;
  }

  try {
    const adminEmail = "rohitkolk@gmail.com";
    const adminPassword = "Rohit1300"; // The initial hardcoded password

    // Check if this specific admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log("⚡ Admin user not found. Seeding now...");

      // Encrypt the password (NEVER store plain text)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // Create the Admin User
      await User.create({
        name: "Rohit",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });

      console.log(`✅ Admin created successfully: ${adminEmail}`);
    } else {
      console.log("ℹ️ Admin user already exists. Skipping seed.");
    }

    // Mark as seeded for this serverless instance
    adminSeeded = true;
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    // Mark as attempted even on error to prevent infinite loops
    adminSeeded = true;
    // Don't throw - allow the app to continue
  }
};

export default seedAdminUser;
