export interface ICreateZonePayload {
  name: string
  code: string
  substation?: string
  feeder?: string
  area?: string
  location?: string
}