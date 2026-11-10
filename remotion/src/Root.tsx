import {Composition} from 'remotion';
import {Short} from './Short';
import {Thumb} from './Thumb';
import {data} from './data';

export const FPS = 30;

export const Root: React.FC = () => (
  <>
  <Composition id="Thumbnail" component={Thumb} width={1080} height={1920} fps={FPS} durationInFrames={1} />
  <Composition
    id="Short"
    component={Short}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={Math.round(data.duration * FPS)}
  />

  </>
);
