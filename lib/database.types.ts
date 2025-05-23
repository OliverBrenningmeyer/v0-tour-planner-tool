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
          latestdeliverydate: string // Changed from latestdeliveryday
          latestdeliverytimewindow: string
          idealdeliverydate: string // Changed from idealdeliveryday
          idealdeliverytimewindow: string
          deliverydate: string | null
          customername: string
          customeraddress: string
          customerphone: string
          loaddescription: string
          referencenumber: string
          weight: string
          volume: string
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
          latestdeliverydate: string // Changed from latestdeliveryday
          latestdeliverytimewindow: string
          idealdeliverydate: string // Changed from idealdeliveryday
          idealdeliverytimewindow: string
          deliverydate?: string | null
          customername: string
          customeraddress: string
          customerphone: string
          loaddescription: string
          referencenumber: string
          weight: string
          volume: string
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
          latestdeliverydate?: string // Changed from latestdeliveryday
          latestdeliverytimewindow?: string
          idealdeliverydate?: string // Changed from idealdeliveryday
          idealdeliverytimewindow?: string
          deliverydate?: string | null
          customername?: string
          customeraddress?: string
          customerphone?: string
          loaddescription?: string
          referencenumber?: string
          weight?: string
          volume?: string
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
      configurations: {
        Row: {
          id: string
          key: string
          value: Json
          description: string
          lastmodifieddate: string
          lastmodifiedby: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description: string
          lastmodifieddate: string
          lastmodifiedby: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string
          lastmodifieddate?: string
          lastmodifiedby?: string
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
