class ApiResponse{
    constructor(statusCode,data=null,message='success'){

        this.statusCode=statusCode
        this.data=data
        this.message=message    
        this.error=null,
        this.success=statusCode<400
    }
}
export default ApiResponse;
