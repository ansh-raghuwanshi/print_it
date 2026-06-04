import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import cookieparser from 'cookie-parser'

const app=express()

app.use(cors())
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(express.static("public"))
app.use(cookieparser())

//health check
app.get("/",(req,res)=>{
  res.send("API is running")
})


//routes import
import userRoutes from './routes/user.routes.js'
import collegeRouter from "./routes/college.routes.js"
import shopRouter from "./routes/shop.routes.js"
import stationeryRouter from "./routes/stationery.routes.js"
import orderRouter from "./routes/order.routes.js"

//routes
app.use("/api/users",userRoutes)
app.use("/api/colleges",collegeRouter)
app.use("/api/shop",shopRouter)
app.use("/api/stationery", stationeryRouter)
app.use("/api/orders", orderRouter)

export default app