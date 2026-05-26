import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import cookieparser from 'cookie-parser'

const app=express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(express.static("public"))
app.use(cookieparser())

//health check
app.get("/",(req,res)=>{
  res.send("API is running")
})

export default app