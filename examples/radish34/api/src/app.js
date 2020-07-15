import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { UI } from 'bull-board';
import bodyParser from 'body-parser';
import axios from 'axios';
import coreQuery from './graphql/schemas/core';
import OrganizationSchema from './graphql/schemas/organization';
import OrganizationResolver from './graphql/resolvers/organization';
import ScalarsSchema from './graphql/schemas/scalars';
import ScalarsResolver from './graphql/resolvers/scalars';
import ServerStatusSchema from './graphql/schemas/serverStatus';
import ServerStatusResolver from './graphql/resolvers/serverStatus';
import ServerStateSchema from './graphql/schemas/serverState';
import ServerStateResolver from './graphql/resolvers/serverState';
import ServerSettingsSchema from './graphql/schemas/serverSettings';
import ServerSettingsResolver from './graphql/resolvers/serverSettings';
import PartnerSchema from './graphql/schemas/partner';
import PartnerResolver from './graphql/resolvers/partner';
import RFPSchema from './graphql/schemas/rfp';
import RFPResolver from './graphql/resolvers/rfp';
import NoticeSchema from './graphql/schemas/notice';
import NoticeResolver from './graphql/resolvers/notice';
import ContractSchema from './graphql/schemas/contract';
import ContractResolver from './graphql/resolvers/contract';
import WalletSchema from './graphql/schemas/wallet';
import WalletResolver from './graphql/resolvers/wallet';
import healthcheck from './install/healthcheck';
import ProposalSchema from './graphql/schemas/proposal';
import ProposalResolver from './graphql/resolvers/proposal';
import MSASchema from './graphql/schemas/msa';
import MSAResolver from './graphql/resolvers/msa';
import ToastrSchema from './graphql/schemas/toastr';
import ToastrResolver from './graphql/resolvers/toastr';
import POSchema from './graphql/schemas/po';
import POResolver from './graphql/resolvers/po';

import AgreementSchema from './graphql/schemas/agreement';
import AgreementResolver from './graphql/resolvers/agreement';

import messageRoutes from './routes/messenger';
import healthRoutes from './routes/healthCheck';

const GRAPHQL_PORT = process.env.GRAPHQL_PORT || 8001;
const REST_PORT = process.env.REST_PORT || 8101;

const typeDefs = [
  OrganizationSchema,
  ServerStatusSchema,
  ScalarsSchema,
  ServerStateSchema,
  ServerSettingsSchema,
  RFPSchema,
  PartnerSchema,
  NoticeSchema,
  ContractSchema,
  WalletSchema,
  ProposalSchema,
  MSASchema,
  ToastrSchema,
  POSchema,
  AgreementSchema,
];
const resolvers = [
  OrganizationResolver,
  ServerStatusResolver,
  ScalarsResolver,
  ServerStateResolver,
  ServerSettingsResolver,
  RFPResolver,
  PartnerResolver,
  NoticeResolver,
  ContractResolver,
  WalletResolver,
  ProposalResolver,
  MSAResolver,
  ToastrResolver,
  POResolver,
  AgreementResolver,
];

export default async function startServer() {
  const app = express();

  app.use(bodyParser.json({ limit: '2mb' }));
  app.use('/', healthRoutes);
  app.use('/api/v1', messageRoutes);
  app.use('/bulls', UI);

  app.listen(REST_PORT, () =>
    console.log(`🚀 Internal REST-Express server listening at http://localhost:${REST_PORT}`),
  );
  await healthcheck();

  const server = new ApolloServer({
    typeDefs: [coreQuery, ...typeDefs],
    resolvers,
    context: async () => {
      const { data } = await axios.get(`${process.env.MESSENGER_URI}/api/v1/identities`);
      const identity = data && data[0] ? data[0].publicKey : null;
      return { identity };
    },
  });
  server.applyMiddleware({ app, path: '/graphql' });

  const httpServer = createServer(app);
  server.installSubscriptionHandlers(httpServer);

  // Spin up workers

  httpServer.listen({ port: GRAPHQL_PORT }, () => {
    console.log(`🚀 Server ready at http://localhost:${GRAPHQL_PORT}${server.graphqlPath}`);
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${GRAPHQL_PORT}${server.subscriptionsPath}`,
    );
  });
}
