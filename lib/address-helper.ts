import { ADDRESS_EXAMPLES } from "./route-service"
import type { Transport } from "./types"

// Get a list of customer addresses only (excluding depots)
export const getCustomerAddresses = (): string[] => {
  return Object.keys(ADDRESS_EXAMPLES).filter((address) => !address.includes("Zentrale") && !address.includes("Lager"))
}

// Get a list of depot addresses only
export const getDepotAddresses = (): string[] => {
  return Object.keys(ADDRESS_EXAMPLES).filter((address) => address.includes("Zentrale") || address.includes("Lager"))
}

// Assign real addresses to transports that don't have them
export const ensureRealAddresses = (transports: Transport[]): Transport[] => {
  const customerAddresses = getCustomerAddresses()

  return transports.map((transport) => {
    // Skip if transport already has a valid address from our list
    if (transport.customerAddress && Object.keys(ADDRESS_EXAMPLES).includes(transport.customerAddress)) {
      return transport
    }

    // Assign a random address from our list
    const randomIndex = Math.floor(Math.random() * customerAddresses.length)
    const randomAddress = customerAddresses[randomIndex]

    return {
      ...transport,
      customerAddress: randomAddress,
    }
  })
}
