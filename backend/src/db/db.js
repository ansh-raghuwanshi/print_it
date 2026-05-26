import mongoose from 'mongoose'

async function connectDB() {
  try {
    const connection = await mongoose.connect(`${process.env.MONGODB_URI} /${process.env.DB_NAME}`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB