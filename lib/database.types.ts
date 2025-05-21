export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      transports: {
        Row: {
          id: string
          name: string
          description: string
          deliveryday: string
          status: string
          vehicletype: string
          size: string
          ordererbranch: string
          orderername: string
          latestdeliveryday: string
          latestdeliverytimewindow: string
          idealdeliveryday: string
          idealdeliverytimewindow: string
          deliverydate: string | null
          customername: string
          customeraddress: string
          customerphone: string
          loaddescription: string
          referencenumber: string
          weight: string
          unloadingoptions: string[]
          documenturl: string | null
          documentname: string | null
          createddate: string
          createdby: string
          lastmodifieddate: string
          lastmodifiedby: string
          creationchannel: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          deliveryday: string
          status: string
          vehicletype: string
          size: string
          ordererbranch: string
          orderername: string
          latestdeliveryday: string
          latestdeliverytimewindow: string
          idealdeliveryday: string
          idealdeliverytimewindow: string
          deliverydate?: string | null
          customername: string
          customeraddress: string
          customerphone: string
          loaddescription: string
          referencenumber: string
          weight: string
          unloadingoptions: string[]
          documenturl?: string | null
          documentname?: string | null
          createddate: string
          createdby: string
          lastmodifieddate: string
          lastmodifiedby: string
          creationchannel: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          deliveryday?: string
          status?: string
          vehicletype?: string
          size?: string
          ordererbranch?: string
          orderername?: string
          latestdeliveryday?: string
          latestdeliverytimewindow?: string
          idealdeliveryday?: string
          idealdeliverytimewindow?: string
          deliverydate?: string | null
          customername?: string
          customeraddress?: string
          customerphone?: string
          loaddescription?: string
          referencenumber?: string
          weight?: string
          unloadingoptions?: string[]
          documenturl?: string | null
          documentname?: string | null
          createddate?: string
          createdby?: string
          lastmodifieddate?: string
          lastmodifiedby?: string
          creationchannel?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
