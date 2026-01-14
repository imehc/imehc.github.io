"use strict";(self.webpackChunkanch=self.webpackChunkanch||[]).push([["3962"],{54567(e,t,n){n.d(t,{A:()=>s});var a=n(35656),i=n(57140),o=n(27112),r=n(82044),l=n(79457);let s=(0,i.forwardRef)(({children:e,loadingText:t="Initializing...",showLoading:n=!0,useFixedWrapper:s=!0,...u},c)=>{let v=(0,i.useRef)(null),[h,d]=(0,o.A)(v);(0,i.useImperativeHandle)(c,()=>v.current,[]);let m="function"==typeof e,f={width:h,height:d},g=()=>m?e?.(f):e;return(0,a.jsx)(r.A,{ref:v,...u,children:h>0&&d>0?s?(0,a.jsx)("div",{className:"tw:absolute tw:top-0 tw:left-0 tw:overflow-hidden",style:{width:h,height:d},children:g()}):g():n?(0,a.jsx)(l.A,{loadText:t}):null})})},27112(e,t,n){n.d(t,{A:()=>i});var a=n(57140);function i(e){let[t,n]=(0,a.useState)([0,0]);return(0,a.useEffect)(()=>{let t=()=>{if(e.current){let{width:t,height:a}=e.current.getBoundingClientRect();n([t,a])}};t();let a=new ResizeObserver(t);return e.current&&a.observe(e.current),()=>{a.disconnect()}},[e]),t}},43041(e,t,n){n.r(t),n.d(t,{default:()=>f});var a=n(35656),i=n(54567),o=n(27112),r=n(97769),l=n(57140),s=n(67199);let u={vertexShader:`
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        #define PI 3.141592653589793
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec2 sunPosition;
        uniform vec2 globeRotation;
        varying vec3 vNormal;
        varying vec2 vUv;

        float toRad(in float a) {
          return a * PI / 180.0;
        }

        vec3 Polar2Cartesian(in vec2 c) { // [lng, lat]
          float theta = toRad(90.0 - c.x);
          float phi = toRad(90.0 - c.y);
          return vec3( // x,y,z
            sin(phi) * cos(theta),
            cos(phi),
            sin(phi) * sin(theta)
          );
        }

        void main() {
          float invLon = toRad(globeRotation.x);
          float invLat = -toRad(globeRotation.y);
          mat3 rotX = mat3(
            1, 0, 0,
            0, cos(invLat), -sin(invLat),
            0, sin(invLat), cos(invLat)
          );
          mat3 rotY = mat3(
            cos(invLon), 0, sin(invLon),
            0, 1, 0,
            -sin(invLon), 0, cos(invLon)
          );
          vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
          float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          float blendFactor = smoothstep(-0.1, 0.1, intensity);
          gl_FragColor = mix(nightColor, dayColor, blendFactor);
        }
      `};function c(e){let t=(280.46646+e*(36000.76983+3032e-7*e))%360;return t<0?t+360:t}function v(e){return 357.52911+e*(35999.05029-1537e-7*e)}function h(e){return 23+(26+(21.448-e*(46.815+e*(59e-5-.001813*e)))/60)/60+.00256*Math.cos(d(125.04-1934.136*e))}function d(e){return Math.PI*e/180}function m(e){return 180*e/Math.PI}function f(){let[e,t]=(0,l.useState)(new Date),n=(0,l.useRef)(null),[f,g]=(0,o.A)(n),x=(0,l.useEffectEvent)(async e=>{let n=Date.now();try{let[a,i]=await Promise.all([new s.Tap().loadAsync("/three-globe/example/img/earth-day.png"),new s.Tap().loadAsync("/three-globe/example/img/earth-night.png")]),o=new s.BKk({uniforms:{dayTexture:{value:a},nightTexture:{value:i},sunPosition:{value:new s.I9Y},globeRotation:{value:new s.I9Y}},vertexShader:u.vertexShader,fragmentShader:u.fragmentShader});e.globeMaterial(o).backgroundImageUrl("/three-globe/example/img/night-sky.png").onZoom(({lng:e,lat:t})=>o.uniforms.globeRotation.value.set(e,t)),!function e(){var a,i,r;let l,s,u,f,g,x,w,p,y,b,M,R;n+=6e4,t(new Date(n));let C=(a=n,l=new Date(+a).setUTCHours(0,0,0,0),(i=a)instanceof Date&&(i=i.getTime()),s=(i-Date.UTC(2e3,0,1,12))/315576e7,[(l-a)/864e5*360-180-(u=h(s),f=c(s),r=s,g=.016708634-r*(42037e-9+1267e-10*r),x=v(s),w=Math.tan(d(u)/2)**2,p=Math.sin(2*d(f)),y=Math.sin(d(x)),b=Math.cos(2*d(f)),M=Math.sin(4*d(f)),4*m(w*p-2*g*y+4*g*w*y*b-.5*w*w*M-1.25*g*g*Math.sin(2*d(x)))/4),m(Math.asin(Math.sin(d(h(s)))*Math.sin(d(c(s)+(R=d(v(s)),Math.sin(R)*(1.914602-s*(.004817+14e-6*s))+Math.sin(2*R)*(.019993-101e-6*s)+289e-6*Math.sin(3*R))-.00569-.00478*Math.sin(d(125.04-1934.136*s))))))]);o.uniforms.sunPosition.value.set(C[0],C[1]),requestAnimationFrame(e)}()}catch(e){console.error("Failed to initialize scene:",e)}});return(0,l.useEffect)(()=>{let{current:e}=n;if(!e||!f||!g)return;let t=new r.A(e).width(f).height(g);return x(t),()=>{t?._destructor()}},[f,g]),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(i.A,{ref:n}),(0,a.jsx)("div",{className:"tw:absolute tw:bottom-4 tw:left-4 tw:text-lightblue tw:font-mono tw:text-sm tw:pointer-events-none tw:text-[lightblue]",children:e.toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1})})]})}}}]);