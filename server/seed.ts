import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedInitialData() {
  try {
    // Check if admin user exists
    const existingAdmin = await storage.getUserByUsername("admin");
    
    if (!existingAdmin) {
      console.log("Creating initial admin user...");
      const hashedPassword = await hashPassword("admin123");
      
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        nome: "Administrador",
        email: "admin@sistema.com",
        role: "admin",
      });
      
      console.log("✓ Initial admin user created:");
      console.log("  Username: admin");
      console.log("  Password: admin123");
      console.log("  Role: admin");
      console.log("  Note: Please change this password on first login");
    }
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}
