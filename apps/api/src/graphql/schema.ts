export const typeDefs = /* GraphQL */ `
  scalar DateTime

  type EnsName {
    id: ID!
    name: String!
    labelHash: String!
    registrant: String!
    controller: String
    registrationDate: DateTime!
    expirationDate: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RegistrationEvent {
    id: ID!
    name: String!
    txHash: String!
    blockNumber: Int!
    blockTime: DateTime!
    registrant: String!
    costEth: String!
    chainId: Int!
    createdAt: DateTime!
  }

  type RenewalEvent {
    id: ID!
    name: String!
    txHash: String!
    blockNumber: Int!
    blockTime: DateTime!
    payer: String!
    costEth: String!
    years: Int!
    chainId: Int!
    createdAt: DateTime!
  }

  type TransferEvent {
    id: ID!
    name: String!
    txHash: String!
    blockNumber: Int!
    blockTime: DateTime!
    from: String!
    to: String!
    chainId: Int!
    createdAt: DateTime!
  }

  type Query {
    health: String!
    registrations(limit: Int = 50, offset: Int = 0): [RegistrationEvent!]!
    renewals(limit: Int = 50, offset: Int = 0): [RenewalEvent!]!
    names(search: String, limit: Int = 50, offset: Int = 0): [EnsName!]!
  }
`;


