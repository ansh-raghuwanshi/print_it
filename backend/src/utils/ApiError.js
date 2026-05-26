class ApiError extends Error{
  constructor(statusCode,message="An error occurred",errors=[]){
    super(message)
    this.statusCode=statusCode
    this.errors=errors
    this.success=false
    Error.captureStackTrace(this,this.constructor)
  }
}
export default ApiError