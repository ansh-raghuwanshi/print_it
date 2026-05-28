import { College } from '../models/colleges.model.js'

const seedDatabase = async () => {
  try {
    // check if colleges already exist
    const collegeCount = await College.countDocuments()

    if (collegeCount > 0) {
      console.log("Database already seeded, skipping...")
      return
    }

    // create default colleges
    await College.insertMany([
      {
        name: "Samrat Ashok Technological Institute",
        shortName: "SATI",
        city: "Vidisha",
        state: "Madhya Pradesh",
        status: "ACTIVE",
       
        approvedAt: new Date(),
      },
      {
        name: "Radharaman Institute of Technology",
        shortName: "RIST",
        city: "Bhopal",
        state: "Madhya Pradesh",
        status: "ACTIVE",
        
        approvedAt: new Date(),
      },
    ])

    console.log("Database seeded successfully")
  } catch (error) {
    console.error("Seeding failed:", error.message)
  }
}

export default seedDatabase