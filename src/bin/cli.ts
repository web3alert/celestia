import { main } from 'triex-app';
import {
  plugins,
  streams,
} from '../';

main(builder => {
  return builder
    .plugin(plugins.cosmos())
  ;
}, async ctx => {
  const {
    log,
    schemas,
    remote,
    cosmos,
  } = ctx;
  
  remote.stream.add('chain', streams.chain({
    log,
    schemas,
    cosmos,
    limits: {
      past: 10,
      future: 4,
    },
  }));
});
