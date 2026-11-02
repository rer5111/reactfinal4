import { createContext } from "react"

export const UserContext = createContext(JSON.parse(localStorage.getItem("user")))