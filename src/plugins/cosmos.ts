import path from 'path';
import type { Log } from 'universe-types';
import { plugin } from 'triex-app';
import { CosmosApiProvider } from '../cosmos/provider';
import { Cosmos } from '../cosmos';

export type ForCosmos = {
  log: Log;
};

export type WithCosmos = {
  cosmos: Cosmos;
};

export const cosmos = () => plugin<ForCosmos, WithCosmos>({
  middleware: async (args, ctx, next) => {
    const {
      log,
    } = ctx;
    
    const url = args['url']!;
    const supportedModules = args['supported-modules']!.split(',');
    const protoPath = path.resolve(__dirname, '../../proto');
    
    const provider = new CosmosApiProvider(url, supportedModules, protoPath);
    const cosmos = new Cosmos({ log, provider });
    
    await next({ cosmos });
  },
});
