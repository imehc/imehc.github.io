import { onCleanup, onMount, type Component } from 'solid-js';
import Map3D, { Map3DState } from './helper/map';
import autofit from 'autofit.js';
import './css/map.css'

const App: Component = () => {
  let containerRef!: HTMLDivElement
  let el!: HTMLCanvasElement
  let map3d: Map3D;
  let state: Map3DState = {
    progress: 0
  }

  onMount(() => {
    autofit.init({
      dh: 1080,
      dw: 1920,
      el: "#large-screen",
      resize: true,
    })
    map3d = new Map3D({ el });
    map3d.initAssets(async () => {
      state = map3d.state
      // 隐藏loading
      // TODO
      map3d.play()
    })
  });

  onCleanup(() => {
    map3d.destroy()
  })

  return (
    <div id="large-screen" class="w-full h-screen bg-black z-1 relative top-0 right-0 bottom-0 left-0" ref={containerRef}>
      <canvas class="w-full h-full" ref={el}></canvas>
    </div>
  );
};

export default App;
