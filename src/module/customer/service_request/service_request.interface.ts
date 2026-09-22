export interface ICreateServiceRequestPayload {
  zoneId: string
  type: string
  description?: string
  
}


export interface IServiceRequestQuery {
  page?: string
  limit?: string
  status?: string
  type?: string
}