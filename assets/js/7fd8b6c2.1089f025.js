(self.webpackChunkanch=self.webpackChunkanch||[]).push([["7716"],{9397(e,t,r){"use strict";r.r(t),r.d(t,{metadata:()=>a,default:()=>w,frontMatter:()=>g,contentTitle:()=>b,toc:()=>D,assets:()=>y});var a=JSON.parse('{"id":"web/three/basic/gltf-scene","title":"GLTF\u573A\u666F","description":"\u6838\u5FC3\u6982\u5FF5","source":"@site/docs/web/three/basic/18-gltf-scene.mdx","sourceDirName":"web/three/basic","slug":"/web/three/basic/gltf-scene","permalink":"/web/three/basic/gltf-scene","draft":false,"unlisted":false,"tags":[{"inline":true,"label":"Javascript","permalink":"/tags/javascript"}],"version":"current","lastUpdatedBy":"dependabot[bot]","lastUpdatedAt":1769646500000,"sidebarPosition":18,"frontMatter":{"sidebar_position":18,"title":"GLTF\u573A\u666F","tags":["Javascript"]},"sidebar":"webSidebar","previous":{"title":"\u73AF\u5883","permalink":"/web/three/basic/environment"},"next":{"title":"useGLTF","permalink":"/web/three/basic/use-gltf"}}'),n=r(35656),i=r(86145),l=r(57720),s=r(74915),u=r(1560),v=r(46571),o=r(19658),c=r(82044),d=r(12730);let f=()=>{let{height:e,radius:t,scale:r}=(0,o._5)("Ground",{height:{value:10,min:0,max:100,step:1},radius:{value:115,min:0,max:1e3,step:1},scale:{value:100,min:0,max:1e3,step:1}});return(0,n.jsx)(d.OH,{preset:"sunset",background:!0,ground:{height:e,radius:t,scale:r}})};var m=r(54600),h=r(13115);let x=()=>{let{scene:e}=(0,m.G)(h.B,"/models/scene.glb"),{x:t,y:r,z:a,visible:i,color:l,metalness:s,roughness:u,clearcoat:v,clearcoatRoughness:c,transmission:d,ior:f,thickness:x}=(0,o._5)("Suzanne",{x:{value:0,min:0,max:2*Math.PI,step:.01},y:{value:0,min:0,max:2*Math.PI,step:.01},z:{value:0,min:0,max:2*Math.PI,step:.01},visible:!0,color:{value:"#ffbc85"},metalness:{value:0,min:0,max:1,step:.01,label:"\u91D1\u5C5E\u5EA6"},roughness:{value:0,min:0,max:1,step:.01,label:"\u7C97\u7CD9\u5EA6"},clearcoat:{value:1,min:0,max:1,step:.01,label:"\u6E05\u6F06"},clearcoatRoughness:{value:0,min:0,max:1,step:.01,label:"\u6E05\u6F06\u7C97\u7CD9\u5EA6"},transmission:{value:1,min:0,max:1,step:.01,label:"\u900F\u5C04\u7387"},ior:{value:1.74,min:1,max:5,step:.01,label:"\u6EB6\u89E3\u7387"},thickness:{value:3.12,min:0,max:5,step:.01,label:"\u539A\u5EA6"}});return(0,n.jsx)("primitive",{object:e,"children-0-rotation":[t,r,a],"children-0-visible":i,"children-0-material-color":l,"children-0-material-metalness":s,"children-0-material-roughness":u,"children-0-material-clearcoat":v,"children-0-material-clearcoatRoughness":c,"children-0-material-transmission":d,"children-0-material-ior":f,"children-0-material-thickness":x})},p=()=>(0,n.jsxs)(c.A,{children:[(0,n.jsxs)(v.Hl,{camera:{position:[-8,5,8]},children:[(0,n.jsx)(f,{}),(0,n.jsx)(x,{}),(0,n.jsx)(l._,{scale:150,position:[.33,-.33,.33],opacity:1.5}),(0,n.jsx)(s.N,{target:[0,1,0],maxPolarAngle:Math.PI/2}),(0,n.jsx)(u.U,{})]}),(0,n.jsx)(o.XA,{collapsed:!0})]}),g={sidebar_position:18,title:"GLTF\u573A\u666F",tags:["Javascript"]},b="GLTF\u573A\u666F",y={},D=[{value:"\u6838\u5FC3\u6982\u5FF5",id:"\u6838\u5FC3\u6982\u5FF5",level:2}];function U(e){let t={h1:"h1",h2:"h2",header:"header",li:"li",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.header,{children:(0,n.jsx)(t.h1,{id:"gltf\u573A\u666F",children:"GLTF\u573A\u666F"})}),"\n",(0,n.jsx)(p,{}),"\n",(0,n.jsx)(t.h2,{id:"\u6838\u5FC3\u6982\u5FF5",children:"\u6838\u5FC3\u6982\u5FF5"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"ContactShadows"}),": \u751F\u6210\u63A5\u89E6\u9634\u5F71\uFF0C\u589E\u5F3A\u7269\u4F53\u4E0E\u5730\u9762\u7684\u4E92\u52A8\u611F"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Leva"}),": UI \u63A7\u5236\u5E93\uFF0C\u7528\u4E8E\u5B9E\u65F6\u8C03\u6574\u53C2\u6570\u5E76\u5728\u6D4F\u89C8\u5668\u4E2D\u663E\u793A\u63A7\u5236\u9762\u677F"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"useControls"}),": Leva \u7684 Hook\uFF0C\u5B9A\u4E49\u53EF\u63A7\u5236\u7684\u53C2\u6570"]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"PBR \u6750\u8D28"}),": \u57FA\u4E8E\u7269\u7406\u7684\u6E32\u67D3\uFF08Physically Based Rendering\uFF09\uFF0C\u63D0\u4F9B\u903C\u771F\u7684\u6750\u8D28\u6548\u679C"]}),"\n"]})]})}function w(e={}){let{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(U,{...e})}):U(e)}},57720(e,t,r){"use strict";r.d(t,{_:()=>v});var a=r(44320),n=r(57140),i=r(67199),l=r(54600);let s={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
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
  `},v=n.forwardRef(({scale:e=10,frames:t=1/0,opacity:r=1,width:v=1,height:o=1,blur:c=1,near:d=0,far:f=10,resolution:m=512,smooth:h=!0,color:x="#000000",depthWrite:p=!1,renderOrder:g,...b},y)=>{let D,U,w=n.useRef(null),j=(0,l.C)(e=>e.scene),S=(0,l.C)(e=>e.gl),M=n.useRef(null);v*=Array.isArray(e)?e[0]:e||1,o*=Array.isArray(e)?e[1]:e||1;let[P,R,k,C,T,A,L]=n.useMemo(()=>{let e=new i.nWS(m,m),t=new i.nWS(m,m);t.texture.generateMipmaps=e.texture.generateMipmaps=!1;let r=new i.bdM(v,o).rotateX(Math.PI/2),a=new i.eaF(r),n=new i.CSG;n.depthTest=n.depthWrite=!1,n.onBeforeCompile=e=>{e.uniforms={...e.uniforms,ucolor:{value:new i.Q1f(x)}},e.fragmentShader=e.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),e.fragmentShader=e.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};let l=new i.BKk(s),c=new i.BKk(u);return c.depthTest=l.depthTest=!1,[e,r,n,a,l,c,t]},[m,v,o,e,x]),I=e=>{C.visible=!0,C.material=T,T.uniforms.tDiffuse.value=P.texture,T.uniforms.h.value=e/256,S.setRenderTarget(L),S.render(C,M.current),C.material=A,A.uniforms.tDiffuse.value=L.texture,A.uniforms.v.value=e/256,S.setRenderTarget(P),S.render(C,M.current),C.visible=!1},E=0;return(0,l.D)(()=>{M.current&&(t===1/0||E<t)&&(E++,D=j.background,U=j.overrideMaterial,w.current.visible=!1,j.background=null,j.overrideMaterial=k,S.setRenderTarget(P),S.render(j,M.current),I(c),h&&I(.4*c),S.setRenderTarget(null),w.current.visible=!0,j.overrideMaterial=U,j.background=D)}),n.useImperativeHandle(y,()=>w.current,[]),n.createElement("group",(0,a.A)({"rotation-x":Math.PI/2},b,{ref:w}),n.createElement("mesh",{renderOrder:g,geometry:R,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},n.createElement("meshBasicMaterial",{transparent:!0,map:P.texture,opacity:r,depthWrite:p})),n.createElement("orthographicCamera",{ref:M,args:[-v/2,v/2,o/2,-o/2,d,f]}))})},1560(e,t,r){"use strict";r.d(t,{U:()=>u});var a=r(57140),n=r(54600),i=r(15697),l=r.n(i);function s(e,t){"function"==typeof e?e(t):null!=e&&(e.current=t)}function u({showPanel:e=0,className:t,parent:r}){let i=function(e,t=[],r){let[n,i]=a.useState();return a.useLayoutEffect(()=>{let t=e();return i(t),s(void 0,t),()=>s(void 0,null)},t),n}(()=>new(l()),[]);return a.useEffect(()=>{if(i){let a=r&&r.current||document.body;i.showPanel(e),null==a||a.appendChild(i.dom);let l=(null!=t?t:"").split(" ").filter(e=>e);l.length&&i.dom.classList.add(...l);let s=(0,n.j)(()=>i.begin()),u=(0,n.k)(()=>i.end());return()=>{l.length&&i.dom.classList.remove(...l),null==a||a.removeChild(i.dom),s(),u()}}},[r,i,t,e]),null}},15697(e){var t;(t=function(){function e(e){return n.appendChild(e.dom),e}function r(e){for(var t=0;t<n.children.length;t++)n.children[t].style.display=t===e?"block":"none";a=e}var a=0,n=document.createElement("div");n.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",n.addEventListener("click",function(e){e.preventDefault(),r(++a%n.children.length)},!1);var i=(performance||Date).now(),l=i,s=0,u=e(new t.Panel("FPS","#0ff","#002")),v=e(new t.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var o=e(new t.Panel("MB","#f08","#201"));return r(0),{REVISION:16,dom:n,addPanel:e,showPanel:r,begin:function(){i=(performance||Date).now()},end:function(){s++;var e=(performance||Date).now();if(v.update(e-i,200),e>l+1e3&&(u.update(1e3*s/(e-l),100),l=e,s=0,o)){var t=performance.memory;o.update(t.usedJSHeapSize/1048576,t.jsHeapSizeLimit/1048576)}return e},update:function(){i=this.end()},domElement:n,setMode:r}}).Panel=function(e,t,r){var a=1/0,n=0,i=Math.round,l=i(window.devicePixelRatio||1),s=80*l,u=48*l,v=3*l,o=2*l,c=3*l,d=15*l,f=74*l,m=30*l,h=document.createElement("canvas");h.width=s,h.height=u,h.style.cssText="width:80px;height:48px";var x=h.getContext("2d");return x.font="bold "+9*l+"px Helvetica,Arial,sans-serif",x.textBaseline="top",x.fillStyle=r,x.fillRect(0,0,s,u),x.fillStyle=t,x.fillText(e,v,o),x.fillRect(c,d,f,m),x.fillStyle=r,x.globalAlpha=.9,x.fillRect(c,d,f,m),{dom:h,update:function(u,p){a=Math.min(a,u),n=Math.max(n,u),x.fillStyle=r,x.globalAlpha=1,x.fillRect(0,0,s,d),x.fillStyle=t,x.fillText(i(u)+" "+e+" ("+i(a)+"-"+i(n)+")",v,o),x.drawImage(h,c+l,d,f-l,m,c,d,f-l,m),x.fillRect(c+f-l,d,l,m),x.fillStyle=r,x.globalAlpha=.9,x.fillRect(c+f-l,d,l,i((1-u/p)*m))}}},e.exports=t}}]);