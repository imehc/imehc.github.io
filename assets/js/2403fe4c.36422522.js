"use strict";(self.webpackChunkanch=self.webpackChunkanch||[]).push([["4743"],{93844(e,t,r){r.r(t),r.d(t,{metadata:()=>s,default:()=>w,frontMatter:()=>g,contentTitle:()=>p,toc:()=>b,assets:()=>y});var s=JSON.parse('{"id":"web/three/basic/gltfjsx","title":"GLTFJSX","description":"\u6838\u5FC3\u6982\u5FF5","source":"@site/docs/web/three/basic/21-gltfjsx.mdx","sourceDirName":"web/three/basic","slug":"/web/three/basic/gltfjsx","permalink":"/web/three/basic/gltfjsx","draft":false,"unlisted":false,"tags":[{"inline":true,"label":"Javascript","permalink":"/tags/javascript"}],"version":"current","lastUpdatedBy":"dependabot[bot]","lastUpdatedAt":1792974565000,"sidebarPosition":21,"frontMatter":{"sidebar_position":21,"title":"GLTFJSX","tags":["Javascript"]},"sidebar":"webSidebar","previous":{"title":"\u6DFB\u52A0\u6CE8\u91CA","permalink":"/web/three/basic/annotations"},"next":{"title":"\u4F7F\u7528\u63D2\u503C(Lerp)","permalink":"/web/three/basic/lerp"}}'),a=r(91987),i=r(67008),n=r(16257),o=r(55612),l=r(70677),v=r(59399),u=r(82044),c=r(37119),m=r(85093),d=r(71763),f=r(68085);function h(e){let[t,r]=(0,d.useState)(!1),{nodes:s,materials:i}=(0,c.p)("/models/shoe-draco.glb");return(0,d.useEffect)(()=>{document.body.style.cursor=t?"pointer":"auto"},[t]),(0,m._5)("Shoe",()=>(console.log("creating color pickers"),Object.keys(i).reduce((e,t)=>Object.assign(e,{[t]:{value:"#"+(0xffffff*Math.random()|0).toString(16).padStart(6,"0"),onChange:e=>{i[t].color=new f.Q1f(e)}}}),{}))),(0,a.jsxs)("group",{...e,dispose:null,onPointerOver:()=>r(!0),onPointerOut:()=>r(!1),onClick:e=>{e.stopPropagation(),document.getElementById("Shoe."+e.object.material.name)?.focus()},children:[(0,a.jsx)("mesh",{geometry:s.shoe.geometry,material:i.laces}),(0,a.jsx)("mesh",{geometry:s.shoe_1.geometry,material:i.mesh}),(0,a.jsx)("mesh",{geometry:s.shoe_2.geometry,material:i.caps}),(0,a.jsx)("mesh",{geometry:s.shoe_3.geometry,material:i.inner}),(0,a.jsx)("mesh",{geometry:s.shoe_4.geometry,material:i.sole}),(0,a.jsx)("mesh",{geometry:s.shoe_5.geometry,material:i.stripes}),(0,a.jsx)("mesh",{geometry:s.shoe_6.geometry,material:i.band}),(0,a.jsx)("mesh",{geometry:s.shoe_7.geometry,material:i.patch})]})}c.p.preload("/models/shoe-draco.glb");let x=()=>(0,a.jsx)(u.A,{children:(0,a.jsxs)(v.Hl,{shadows:!0,camera:{position:[0,0,1.66]},children:[(0,a.jsx)(n.OH,{preset:"forest"}),(0,a.jsx)(h,{}),(0,a.jsx)(o._,{position:[0,-.8,0],color:"#ffffff"}),(0,a.jsx)(l.N,{autoRotate:!0})]})}),g={sidebar_position:21,title:"GLTFJSX",tags:["Javascript"]},p="GLTFJSX",y={},b=[{value:"\u6838\u5FC3\u6982\u5FF5",id:"\u6838\u5FC3\u6982\u5FF5",level:2}];function j(e){let t={h1:"h1",h2:"h2",header:"header",li:"li",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.header,{children:(0,a.jsx)(t.h1,{id:"gltfjsx",children:"GLTFJSX"})}),"\n",(0,a.jsx)(x,{}),"\n",(0,a.jsx)(t.h2,{id:"\u6838\u5FC3\u6982\u5FF5",children:"\u6838\u5FC3\u6982\u5FF5"}),"\n",(0,a.jsxs)(t.ul,{children:["\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.strong,{children:"GLTFJSX \u5DE5\u5177"}),": \u81EA\u52A8\u5C06 3D \u6A21\u578B\u6587\u4EF6\u8F6C\u6362\u4E3A\u53EF\u590D\u7528\u7684 React \u7EC4\u4EF6"]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.strong,{children:"useGLTF Hook"}),": \u4ECE drei \u63D0\u4F9B\u7684 Hook\uFF0C\u7528\u4E8E\u52A0\u8F7D glTF/GLB \u6A21\u578B"]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.strong,{children:"\u6A21\u578B\u9884\u52A0\u8F7D"}),": useGLTF.preload() \u5728\u7EC4\u4EF6\u52A0\u8F7D\u524D\u51C6\u5907\u8D44\u6E90\uFF0C\u63D0\u9AD8\u6027\u80FD"]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.strong,{children:"Leva \u63A7\u5236\u9762\u677F"}),": \u5B9E\u65F6\u8C03\u6574\u6A21\u578B\u6750\u8D28\u5C5E\u6027\uFF08\u5982\u989C\u8272\uFF09\u7684 UI \u754C\u9762"]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.strong,{children:"\u4EA4\u4E92"}),": \u652F\u6301\u9F20\u6807\u60AC\u505C\u548C\u70B9\u51FB\u4E8B\u4EF6\uFF0C\u4E0E 3D \u6A21\u578B\u4EA4\u4E92"]}),"\n"]})]})}function w(e={}){let{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(j,{...e})}):j(e)}},55612(e,t,r){r.d(t,{_:()=>v});var s=r(65062),a=r(71763),i=r(68085),n=r(49200);let o={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
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
  `},l={uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`
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
  `},v=a.forwardRef(({scale:e=10,frames:t=1/0,opacity:r=1,width:v=1,height:u=1,blur:c=1,near:m=0,far:d=10,resolution:f=512,smooth:h=!0,color:x="#000000",depthWrite:g=!1,renderOrder:p,...y},b)=>{let j,w,D=a.useRef(null),U=(0,n.D)(e=>e.scene),S=(0,n.D)(e=>e.gl),k=a.useRef(null);v*=Array.isArray(e)?e[0]:e||1,u*=Array.isArray(e)?e[1]:e||1;let[M,T,_,F,C,R,L]=a.useMemo(()=>{let e=new i.nWS(f,f),t=new i.nWS(f,f);t.texture.generateMipmaps=e.texture.generateMipmaps=!1;let r=new i.bdM(v,u).rotateX(Math.PI/2),s=new i.eaF(r),a=new i.CSG;a.depthTest=a.depthWrite=!1,a.onBeforeCompile=e=>{e.uniforms={...e.uniforms,ucolor:{value:new i.Q1f(x)}},e.fragmentShader=e.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),e.fragmentShader=e.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};let n=new i.BKk(o),c=new i.BKk(l);return c.depthTest=n.depthTest=!1,[e,r,a,s,n,c,t]},[f,v,u,e,x]),A=e=>{F.visible=!0,F.material=C,C.uniforms.tDiffuse.value=M.texture,C.uniforms.h.value=e/256,S.setRenderTarget(L),S.render(F,k.current),F.material=R,R.uniforms.tDiffuse.value=L.texture,R.uniforms.v.value=e/256,S.setRenderTarget(M),S.render(F,k.current),F.visible=!1},G=0;return(0,n.F)(()=>{k.current&&(t===1/0||G<t)&&(G++,j=U.background,w=U.overrideMaterial,D.current.visible=!1,U.background=null,U.overrideMaterial=_,S.setRenderTarget(M),S.render(U,k.current),A(c),h&&A(.4*c),S.setRenderTarget(null),D.current.visible=!0,U.overrideMaterial=w,U.background=j)}),a.useImperativeHandle(b,()=>D.current,[]),a.createElement("group",(0,s.A)({"rotation-x":Math.PI/2},y,{ref:D}),a.createElement("mesh",{renderOrder:p,geometry:T,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},a.createElement("meshBasicMaterial",{transparent:!0,map:M.texture,opacity:r,depthWrite:g})),a.createElement("orthographicCamera",{ref:k,args:[-v/2,v/2,u/2,-u/2,m,d]}))})},82044(e,t,r){r.d(t,{A:()=>n});var s=r(91987),a=r(30016),i=r(13526);let n=(0,r(71763).forwardRef)(({children:e,className:t,hiddenBorder:r=!1,autoHeight:n=!1,fullWidth:o=!1},l)=>(0,s.jsx)("div",{ref:l,className:(0,i.A)("tw:w-full tw:relative",{"tw:border tw:border-base-300 tw:box-border":!r},{"tw:aspect-video tw:overflow-hidden":!n},[o?"tw:w-full":"tw:md:w-2xl"],t),children:(0,s.jsx)(a.A,{fallback:({error:e,tryAgain:t})=>(0,s.jsxs)("div",{className:"tw:h-full tw:flex tw:flex-col tw:justify-center tw:items-center",children:[(0,s.jsx)("div",{children:"Something went wrong"}),(0,s.jsx)("div",{className:"tw:text-error",children:e.message}),(0,s.jsx)("button",{type:"button",className:"tw:btn tw:btn-sm tw:btn-primary",onClick:()=>t(),children:"Reload"})]}),children:e})}))}}]);