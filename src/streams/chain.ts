import type { Log } from 'universe-types';
import {
  Schemas,
  StreamSpec,
  stream,
} from 'triex-app';
import type { Cosmos } from '../cosmos';

export type Options = {
  log: Log;
  schemas: Schemas;
  cosmos: Cosmos;
  limits: {
    past: number;
    future: number;
  };
};

export type State = {
  block: number;
};

export type Params = {
  event: string;
};

export function chain(options: Options): StreamSpec {
  const {
    log,
    schemas,
    cosmos,
    limits,
  } = options;
  
  const isState = schemas.is<State>({
    type: 'object',
    properties: {
      blockHeight: { type: 'number' },
    },
    required: ['blockHeight'],
  });
  
  const isParams = schemas.is<Params>({
    type: 'object',
    properties: {
      event: { type: 'string' },
    },
    required: ['event'],
  });
  
  return stream()
    .state(isState)
    .params.static(isParams)
    .enumerate(async () => {
      const specs = await cosmos.getSpecs();
      
      return specs.map(spec => {
        return {
          params: {
            event: spec.name,
          },
          schema: spec.schema,
          labels: spec.meta.labels,
          meta: {
            title: spec.meta.name,
            description: spec.meta.description,
          },
        };
      });
    })
    .process(async ctx => {
      let state = ctx.state;
      
      if (!state) {
        state = {
          block: await cosmos.getLatestBlockHeight(),
        };
      }
      
      const prev = state.block;
      const next = await cosmos.getLatestBlockHeight();
      
      let distance = next - prev;
      
      if (distance <= -limits.past) {
        log.warn({
          prev,
          next,
          distance,
          limit: limits.past,
        }, 'block range exceeds past limit, skip to present');
        
        return {
          state: { block: next },
          output: [],
        };
      }
      
      if (distance < 0) {
        return {
          state: { block: prev },
          output: [],
        };
      }
      
      if (distance > limits.future) {
        log.warn({
          prev,
          next,
          distance,
          limit: limits.future,
        }, 'block range clamped to future limit');
        
        distance = limits.future;
      }
      
      const from = prev + 1;
      const to = prev + distance;
      log.trace({ prev, next, from, to, distance });
      const events = await cosmos.getEventsInRange(from, to, [ctx.params.event]);
      
      return {
        state: { block: to },
        output: events,
      };
    })
    .spec()
  ;
}
