import {
  useCamera,
  useComposer,
  useControls,
  useRenderer,
  useScene,
  useStats,
} from "./init";
import { TickData } from "./init";

const localData: TickData = {
  timestamp: 0,
  timeDiff: 0,
  frame: null,
};

class TickManager extends EventTarget {
  private timestamp: number;
  private timeDiff: number;
  private frame: XRFrame | null;

  constructor({
    timestamp = 0,
    timeDiff = 0,
    frame = null,
  }: Partial<TickData> = localData) {
    super();

    this.timestamp = timestamp;
    this.timeDiff = timeDiff;
    this.frame = frame;
  }

  startLoop(): void {
    const composer = useComposer();
    const renderer = useRenderer();
    const scene = useScene();
    const camera = useCamera();
    const controls = useControls();
    const stats = useStats();

    if (!renderer) {
      throw new Error("Updating Frame Failed : Uninitialized Renderer");
    }

    let lastTimestamp = performance.now();

    const animate = (timestamp?: number, frame?: XRFrame): void => {
      this.timestamp = timestamp ?? performance.now();
      this.timeDiff = this.timestamp - lastTimestamp;

      const timeDiffCapped = Math.min(Math.max(this.timeDiff, 0), 100);

      controls.update();
      composer.render();

      this.tick({
        timestamp: this.timestamp,
        timeDiff: timeDiffCapped,
        frame: frame ?? null,
      });

      stats.update();
      lastTimestamp = this.timestamp;
    };
    renderer.setAnimationLoop(animate);
  }

  private tick(tickData: TickData): void {
    const tickEvent = new CustomEvent<TickData>("tick", { detail: tickData });
    this.dispatchEvent(tickEvent);
  }
}

export default TickManager;
