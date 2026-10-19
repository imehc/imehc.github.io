(self.webpackChunkanch=self.webpackChunkanch||[]).push([["7716"],{84887(e,t,r){"use strict";r.r(t),r.d(t,{metadata:()=>a,default:()=>U,frontMatter:()=>g,contentTitle:()=>b,toc:()=>y,assets:()=>w});var a=JSON.parse('{"id":"web/three/basic/gltf-scene","title":"GLTF\u573A\u666F","description":"\u6838\u5FC3\u6982\u5FF5","source":"@site/docs/web/three/basic/18-gltf-scene.mdx","sourceDirName":"web/three/basic","slug":"/web/three/basic/gltf-scene","permalink":"/web/three/basic/gltf-scene","draft":false,"unlisted":false,"tags":[{"inline":true,"label":"Javascript","permalink":"/tags/javascript"}],"version":"current","lastUpdatedBy":"imehc","lastUpdatedAt":1792410500000,"sidebarPosition":18,"frontMatter":{"sidebar_position":18,"title":"GLTF\u573A\u666F","tags":["Javascript"]},"sidebar":"webSidebar","previous":{"title":"\u73AF\u5883","permalink":"/web/three/basic/environment"},"next":{"title":"useGLTF","permalink":"/web/three/basic/use-gltf"}}'),i=r(91987),n=r(67008),l=r(30780),s=r(76582),u=r(40160),o=r(67920),v=r(85093),c=r(82044),d=r(57887);let f=()=>{let{height:e,radius:t,scale:r}=(0,v._5)("Ground",{height:{value:10,min:0,max:100,step:1},radius:{value:115,min:0,max:1e3,step:1},scale:{value:100,min:0,max:1e3,step:1}});return(0,i.jsx)(d.OH,{preset:"sunset",background:!0,ground:{height:e,radius:t,scale:r}})};var m=r(65728),h=r(7801);let x=()=>{let{scene:e}=(0,m.G)(h.B,"/models/scene.glb"),{x:t,y:r,z:a,visible:n,color:l,metalness:s,roughness:u,clearcoat:o,clearcoatRoughness:c,transmission:d,ior:f,thickness:x}=(0,v._5)("Suzanne",{x:{value:0,min:0,max:2*Math.PI,step:.01},y:{value:0,min:0,max:2*Math.PI,step:.01},z:{value:0,min:0,max:2*Math.PI,step:.01},visible:!0,color:{value:"#ffbc85"},metalness:{value:0,min:0,max:1,step:.01,label:"\u91D1\u5C5E\u5EA6"},roughness:{value:0,min:0,max:1,step:.01,label:"\u7C97\u7CD9\u5EA6"},clearcoat:{value:1,min:0,max:1,step:.01,label:"\u6E05\u6F06"},clearcoatRoughness:{value:0,min:0,max:1,step:.01,label:"\u6E05\u6F06\u7C97\u7CD9\u5EA6"},transmission:{value:1,min:0,max:1,step:.01,label:"\u900F\u5C04\u7387"},ior:{value:1.74,min:1,max:5,step:.01,label:"\u6EB6\u89E3\u7387"},thickness:{value:3.12,min:0,max:5,step:.01,label:"\u539A\u5EA6"}});return(0,i.jsx)("primitive",{object:e,"children-0-rotation":[t,r,a],"children-0-visible":n,"children-0-material-color":l,"children-0-material-metalness":s,"children-0-material-roughness":u,"children-0-material-clearcoat":o,"children-0-material-clearcoatRoughness":c,"children-0-material-transmission":d,"children-0-material-ior":f,"children-0-material-thickness":x})},p=()=>(0,i.jsxs)(c.A,{children:[(0,i.jsxs)(o.Hl,{camera:{position:[-8,5,8]},children:[(0,i.jsx)(f,{}),(0,i.jsx)(x,{}),(0,i.jsx)(l._,{scale:150,position:[.33,-.33,.33],opacity:1.5}),(0,i.jsx)(s.N,{target:[0,1,0],maxPolarAngle:Math.PI/2}),(0,i.jsx)(u.U,{})]}),(0,i.jsx)(v.XA,{collapsed:!0})]}),g={sidebar_position:18,title:"GLTF\u573A\u666F",tags:["Javascript"]},b="GLTF\u573A\u666F",w={},y=[{value:"\u6838\u5FC3\u6982\u5FF5",id:"\u6838\u5FC3\u6982\u5FF5",level:2}];function D(e){let t={h1:"h1",h2:"h2",header:"header",li:"li",strong:"strong",ul:"ul",...(0,n.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.header,{children:(0,i.jsx)(t.h1,{id:"gltf\u573A\u666F",children:"GLTF\u573A\u666F"})}),"\n",(0,i.jsx)(p,{}),"\n",(0,i.jsx)(t.h2,{id:"\u6838\u5FC3\u6982\u5FF5",children:"\u6838\u5FC3\u6982\u5FF5"}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"ContactShadows"}),": \u751F\u6210\u63A5\u89E6\u9634\u5F71\uFF0C\u589E\u5F3A\u7269\u4F53\u4E0E\u5730\u9762\u7684\u4E92\u52A8\u611F"]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"Leva"}),": UI \u63A7\u5236\u5E93\uFF0C\u7528\u4E8E\u5B9E\u65F6\u8C03\u6574\u53C2\u6570\u5E76\u5728\u6D4F\u89C8\u5668\u4E2D\u663E\u793A\u63A7\u5236\u9762\u677F"]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"useControls"}),": Leva \u7684 Hook\uFF0C\u5B9A\u4E49\u53EF\u63A7\u5236\u7684\u53C2\u6570"]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"PBR \u6750\u8D28"}),": \u57FA\u4E8E\u7269\u7406\u7684\u6E32\u67D3\uFF08Physically Based Rendering\uFF09\uFF0C\u63D0\u4F9B\u903C\u771F\u7684\u6750\u8D28\u6548\u679C"]}),"\n"]})]})}function U(e={}){let{wrapper:t}={...(0,n.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(D,{...e})}):D(e)}},30780(e,t,r){"use strict";r.d(t,{_:()=>o});var a=r(65062),i=r(71763),n=r(68085),l=r(65728);let s={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
      varying vec2 vUv;

      void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float h;

    varying vec2 vUv;

    void main() {

    	vec4 sum = vec4( 0.0 );

    	sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

    	gl_FragColor = sum;

    }
  `},u={uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`
    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`

  uniform sampler2D tDiffuse;
  uniform float v;

  varying vec2 vUv;

  void main() {

    vec4 sum = vec4( 0.0 );

    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

    gl_FragColor = sum;

  }
  `},o=i.forwardRef(({scale:e=10,frames:t=1/0,opacity:r=1,width:o=1,height:v=1,blur:c=1,near:d=0,far:f=10,resolution:m=512,smooth:h=!0,color:x="#000000",depthWrite:p=!1,renderOrder:g,...b},w)=>{let y,D,U=i.useRef(null),j=(0,l.C)(e=>e.scene),S=(0,l.C)(e=>e.gl),M=i.useRef(null);o*=Array.isArray(e)?e[0]:e||1,v*=Array.isArray(e)?e[1]:e||1;let[R,k,P,C,T,A,L]=i.useMemo(()=>{let e=new n.nWS(m,m),t=new n.nWS(m,m);t.texture.generateMipmaps=e.texture.generateMipmaps=!1;let r=new n.bdM(o,v).rotateX(Math.PI/2),a=new n.eaF(r),i=new n.CSG;i.depthTest=i.depthWrite=!1,i.onBeforeCompile=e=>{e.uniforms={...e.uniforms,ucolor:{value:new n.Q1f(x)}},e.fragmentShader=e.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),e.fragmentShader=e.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};let l=new n.BKk(s),c=new n.BKk(u);return c.depthTest=l.depthTest=!1,[e,r,i,a,l,c,t]},[m,o,v,e,x]),I=e=>{C.visible=!0,C.material=T,T.uniforms.tDiffuse.value=R.texture,T.uniforms.h.value=e/256,S.setRenderTarget(L),S.render(C,M.current),C.material=A,A.uniforms.tDiffuse.value=L.texture,A.uniforms.v.value=e/256,S.setRenderTarget(R),S.render(C,M.current),C.visible=!1},E=0;return(0,l.D)(()=>{M.current&&(t===1/0||E<t)&&(E++,y=j.background,D=j.overrideMaterial,U.current.visible=!1,j.background=null,j.overrideMaterial=P,S.setRenderTarget(R),S.render(j,M.current),I(c),h&&I(.4*c),S.setRenderTarget(null),U.current.visible=!0,j.overrideMaterial=D,j.background=y)}),i.useImperativeHandle(w,()=>U.current,[]),i.createElement("group",(0,a.A)({"rotation-x":Math.PI/2},b,{ref:U}),i.createElement("mesh",{renderOrder:g,geometry:k,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},i.createElement("meshBasicMaterial",{transparent:!0,map:R.texture,opacity:r,depthWrite:p})),i.createElement("orthographicCamera",{ref:M,args:[-o/2,o/2,v/2,-v/2,d,f]}))})},40160(e,t,r){"use strict";r.d(t,{U:()=>u});var a=r(71763),i=r(65728),n=r(15697),l=r.n(n);function s(e,t){"function"==typeof e?e(t):null!=e&&(e.current=t)}function u({showPanel:e=0,className:t,parent:r}){let n=function(e,t=[]){let[r,i]=a.useState();return a.useLayoutEffect(()=>{let t=e();return i(t),s(void 0,t),()=>s(void 0,null)},t),r}(()=>new(l()),[]);return a.useEffect(()=>{if(n){let a=r&&r.current||document.body;n.showPanel(e),null==a||a.appendChild(n.dom);let l=(null!=t?t:"").split(" ").filter(e=>e);l.length&&n.dom.classList.add(...l);let s=(0,i.j)(()=>n.begin()),u=(0,i.k)(()=>n.end());return()=>{l.length&&n.dom.classList.remove(...l),null==a||a.removeChild(n.dom),s(),u()}}},[r,n,t,e]),null}},15697(e){var t;(t=function(){function e(e){return i.appendChild(e.dom),e}function r(e){for(var t=0;t<i.children.length;t++)i.children[t].style.display=t===e?"block":"none";a=e}var a=0,i=document.createElement("div");i.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",i.addEventListener("click",function(e){e.preventDefault(),r(++a%i.children.length)},!1);var n=(performance||Date).now(),l=n,s=0,u=e(new t.Panel("FPS","#0ff","#002")),o=e(new t.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var v=e(new t.Panel("MB","#f08","#201"));return r(0),{REVISION:16,dom:i,addPanel:e,showPanel:r,begin:function(){n=(performance||Date).now()},end:function(){s++;var e=(performance||Date).now();if(o.update(e-n,200),e>l+1e3&&(u.update(1e3*s/(e-l),100),l=e,s=0,v)){var t=performance.memory;v.update(t.usedJSHeapSize/1048576,t.jsHeapSizeLimit/1048576)}return e},update:function(){n=this.end()},domElement:i,setMode:r}}).Panel=function(e,t,r){var a=1/0,i=0,n=Math.round,l=n(window.devicePixelRatio||1),s=80*l,u=48*l,o=3*l,v=2*l,c=3*l,d=15*l,f=74*l,m=30*l,h=document.createElement("canvas");h.width=s,h.height=u,h.style.cssText="width:80px;height:48px";var x=h.getContext("2d");return x.font="bold "+9*l+"px Helvetica,Arial,sans-serif",x.textBaseline="top",x.fillStyle=r,x.fillRect(0,0,s,u),x.fillStyle=t,x.fillText(e,o,v),x.fillRect(c,d,f,m),x.fillStyle=r,x.globalAlpha=.9,x.fillRect(c,d,f,m),{dom:h,update:function(u,p){a=Math.min(a,u),i=Math.max(i,u),x.fillStyle=r,x.globalAlpha=1,x.fillRect(0,0,s,d),x.fillStyle=t,x.fillText(n(u)+" "+e+" ("+n(a)+"-"+n(i)+")",o,v),x.drawImage(h,c+l,d,f-l,m,c,d,f-l,m),x.fillRect(c+f-l,d,l,m),x.fillStyle=r,x.globalAlpha=.9,x.fillRect(c+f-l,d,l,n((1-u/p)*m))}}},e.exports=t},82044(e,t,r){"use strict";r.d(t,{A:()=>l});var a=r(91987),i=r(92911),n=r(13526);let l=(0,r(71763).forwardRef)(({children:e,className:t,hiddenBorder:r=!1,autoHeight:l=!1,fullWidth:s=!1},u)=>(0,a.jsx)("div",{ref:u,className:(0,n.A)("tw:w-full tw:relative",{"tw:border tw:border-base-300 tw:box-border":!r},{"tw:aspect-video tw:overflow-hidden":!l},[s?"tw:w-full":"tw:md:w-2xl"],t),children:(0,a.jsx)(i.A,{fallback:({error:e,tryAgain:t})=>(0,a.jsxs)("div",{className:"tw:h-full tw:flex tw:flex-col tw:justify-center tw:items-center",children:[(0,a.jsx)("div",{children:"Something went wrong"}),(0,a.jsx)("div",{className:"tw:text-error",children:e.message}),(0,a.jsx)("button",{type:"button",className:"tw:btn tw:btn-sm tw:btn-primary",onClick:()=>t(),children:"Reload"})]}),children:e})}))}}]);