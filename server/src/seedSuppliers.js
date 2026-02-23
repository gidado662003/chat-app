const mongoose = require("mongoose");
const Supplier = require("./models/supplier.schema");

const suppliers = [
  "E STEVE NIGERIA ENTERPRISES",
  "AJC GLOBAL INVESTMENT LTD",
  "PAKING GLOBAL RESOURCES LTD",
  "SOFTSKY TECH",
  "NESSOM GLOBAL SERVICES NIG LTD",
  "KELVIN SYSTEMS",
  "CEETRON TECHNOLOGIES LTD",
  "EXCESS BLESSING TECH",
  "CARBILO TECH LTD",
  "CRYSTAL JEGJ LTD",
  "CASMAN COMPUTERS",
  "LUCKY TECH",
  "NEW TECH NETWORKING",
  "CLINE LINKS LTD",
  "SHIMEED INTEGRATED ENTERPRISES",
  "EMPIC STAR",
  "BARDON FURNITURE",
  "TATRAC SOLAR ENERGY",
  "AMPLIFIED NETWORKS AND SECURITY LTD",
  "XTEK SOLUTIONS LIMITED",
  "SANPEAK LINK TECH",
  "FIBER PLANET",
  "AB SERVER TECH",
];

async function seedSuppliers() {
  try {
    await mongoose.connect(
      "mongodb://syscode:syscode@10.10.253.3:27017/minidev?authSource=admin",
    );

    for (const name of suppliers) {
      await Supplier.updateOne(
        { name },
        { $setOnInsert: { name } },
        { upsert: true },
      );
    }

    console.log("✅ Suppliers seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedSuppliers();
