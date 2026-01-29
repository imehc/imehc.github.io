import { type WebGLProgramParametersWithUniforms, type MeshBasicMaterial, Color } from "three";
import Time from "../../utils/time";

interface DiffuseShaderConfig {
    material: MeshBasicMaterial
    time: Time
    size?: number
    diffuseSpeed?: number
    diffuseColor?: number
    diffuseWidth?: number
    callback?: ((shader: WebGLProgramParametersWithUniforms, maxTime: number) => void)
}

const defaultOption = {
    size: 100,
    diffuseSpeed: 15.0,
    diffuseColor: 0x8e9b9e,
    diffuseWidth: 10.0,
}

type DiffuseShaderOption = (typeof defaultOption) & {
    material: MeshBasicMaterial
}

export default class DiffuseShader {
    #time: DiffuseShaderConfig['time']
    #pointShader: WebGLProgramParametersWithUniforms | null
    #callback: DiffuseShaderConfig['callback']
    #option: DiffuseShaderOption

    constructor(config: DiffuseShaderConfig) {
        this.#time = config.time
        this.#pointShader = null
        this.#callback = config.callback;
        this.#option = Object.assign({}, defaultOption, {
            material: config.material,
            size: config.size,
            diffuseColor: config.diffuseColor,
            diffuseSpeed: config.diffuseSpeed,
            diffuseWidth: config.diffuseWidth,
        })
        this.init()
    }

    get time() {
        return this.#time
    }

    get pointShader() {
        return this.#pointShader
    }

    init() {
        const { material, size, diffuseColor, diffuseSpeed, diffuseWidth } =
            this.#option;
        const maxTime = size / diffuseSpeed;

        material.onBeforeCompile = (shader) => {
            this.#pointShader = shader;
            this.#callback?.(shader, maxTime);
            shader.uniforms = {
                ...shader.uniforms,
                uTime: {
                    value: 0.0,
                },
                uSpeed: {
                    value: diffuseSpeed,
                },
                uWidth: {
                    value: diffuseWidth,
                },
                uColor: {
                    value: new Color(diffuseColor),
                },
            };
            shader.vertexShader = shader.vertexShader.replace(
                "void main() {",
        /* glsl */ `
            varying vec3 vPosition;
            void main(){
              vPosition = position;
          `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                "void main() {",
        /* glsl */ `
            uniform float uTime;
            uniform float uSpeed;
            uniform float uWidth;
            uniform vec3 uColor;
            varying vec3 vPosition;
            void main(){
          `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <opaque_fragment>",
        /* glsl */ `
            #ifdef OPAQUE
            diffuseColor.a = 1.0;
            #endif
            
            #ifdef USE_TRANSMISSION
            diffuseColor.a *= material.transmissionAlpha;
            #endif
            
            float r = uTime * uSpeed;
          
            float w = uWidth; 
            // if(w>uWidth){
            //   w = uWidth;
            // }else{
            //   w = uTime * 1.5;
            // }
           
            vec2 center = vec2(0.0, 0.0); 
           
            float rDistance = distance(vPosition.xy, center);
            
            if(rDistance > r && rDistance < r + 2.0 * w) {
              float per = 0.0;
              if(rDistance < r + w) {
                float p = smoothstep(0.0,1.0,(rDistance - r) / w);
                p*=p;
                outgoingLight = mix(outgoingLight, uColor, p);
              } else {
                
                float p = smoothstep(0.0,1.0,(rDistance - r - w) / w);
                
                outgoingLight = mix(uColor, outgoingLight, p);
              }
              gl_FragColor = vec4(outgoingLight, diffuseColor.a);
            } else {
              gl_FragColor = vec4(outgoingLight, 0.0);
            }
          `
            );
        };
    }
}