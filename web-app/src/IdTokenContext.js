import React from 'react'

const IdTokenContext = React.createContext()

export const IdTokenProvider = IdTokenContext.Provider
export const IdTokenConsumer = IdTokenContext.Consumer

export default IdTokenContext