import {Composition} from 'remotion';
import {Short} from './Short';
import data from '../public/data.json';

export const FPS = 30;

export const Root: React.FC = () => (
  <Composition
    id="Short"
    component={Short}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={Math.round(data.duration * FPS)}
  />
);
