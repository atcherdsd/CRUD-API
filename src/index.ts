import { LoadBalancer } from './LoadBalancer';
import { SingleServer } from './SingleServer';

if (process.env.CASE === 'multiple') {
  const server = new LoadBalancer();
  server.start();
} else {
  const server = new SingleServer();
  server.start();
}
