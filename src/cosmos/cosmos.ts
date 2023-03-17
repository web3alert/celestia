import type { Log } from 'universe-types';
import type {
  Event,
  Spec,
  CosmosApiProvider,
} from './provider';

export type CosmosOptions = {
  log: Log;
  provider: CosmosApiProvider;
};

export class Cosmos {
  private log: Log;
  private provider: CosmosApiProvider;
  
  constructor(options: CosmosOptions) {
    const {
      log,
      provider,
    } = options;
    
    this.log = log;
    this.provider = provider;
  }
  
  public async getLatestBlockHeight(): Promise<number> {
    const latestBlock = await this.provider.getLatesBlock();
    
    return latestBlock.height;
  }
  
  public async getEventsInRange(from: number, to: number, names: string[]): Promise<Event[]> {
    if (to < from) {
      throw new Error('invalid range');
    }
    
    const result: Event[] = [];
    
    for (let block = from; block <= to; block++) {
      const events = await this.getEventsInBlock(block, names);
      
      result.push(...events);
    }
    
    return result;
  }
  
  public async getEventsInBlock(block: number, names: string[]): Promise<Event[]> {
    const events = await this.provider.getEvents(block);
    this.log.trace({ block, events });
    const result = events.filter(event => names.includes(event.name));
    
    return result;
  }

  public async getSpecs(): Promise<Spec[]> {
    return await this.provider.getSpecs(this.log);
  }
}
