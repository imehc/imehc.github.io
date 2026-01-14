"use strict";(self.webpackChunkanch=self.webpackChunkanch||[]).push([["5885"],{44876(e,t,i){i.d(t,{m:()=>f});var n=i(44320),r=i(57140),o=i(67199),a=i(39868),l=Object.defineProperty,s=(e,t,i)=>{let n;return(n="symbol"!=typeof t?t+"":t)in e?l(e,n,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[n]=i,i};let c=(()=>{let e={uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new o.Pq0},up:{value:new o.Pq0(0,1,0)}},vertexShader:`
      uniform vec3 sunPosition;
      uniform float rayleigh;
      uniform float turbidity;
      uniform float mieCoefficient;
      uniform vec3 up;

      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      // constants for atmospheric scattering
      const float e = 2.71828182845904523536028747135266249775724709369995957;
      const float pi = 3.141592653589793238462643383279502884197169;

      // wavelength of used primaries, according to preetham
      const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
      // this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
      // (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
      const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

      // mie stuff
      // K coefficient for the primaries
      const float v = 4.0;
      const vec3 K = vec3( 0.686, 0.678, 0.666 );
      // MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
      const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

      // earth shadow hack
      // cutoffAngle = pi / 1.95;
      const float cutoffAngle = 1.6110731556870734;
      const float steepness = 1.5;
      const float EE = 1000.0;

      float sunIntensity( float zenithAngleCos ) {
        zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
        return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
      }

      vec3 totalMie( float T ) {
        float c = ( 0.2 * T ) * 10E-18;
        return 0.434 * c * MieConst;
      }

      void main() {

        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        gl_Position.z = gl_Position.w; // set z to camera.far

        vSunDirection = normalize( sunPosition );

        vSunE = sunIntensity( dot( vSunDirection, up ) );

        vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

        float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

      // extinction (absorbtion + out scattering)
      // rayleigh coefficients
        vBetaR = totalRayleigh * rayleighCoefficient;

      // mie coefficients
        vBetaM = totalMie( turbidity ) * mieCoefficient;

      }
    `,fragmentShader:`
      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      uniform float mieDirectionalG;
      uniform vec3 up;

      const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );

      // constants for atmospheric scattering
      const float pi = 3.141592653589793238462643383279502884197169;

      const float n = 1.0003; // refractive index of air
      const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

      // optical length at zenith for molecules
      const float rayleighZenithLength = 8.4E3;
      const float mieZenithLength = 1.25E3;
      // 66 arc seconds -> degrees, and the cosine of that
      const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

      // 3.0 / ( 16.0 * pi )
      const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
      // 1.0 / ( 4.0 * pi )
      const float ONE_OVER_FOURPI = 0.07957747154594767;

      float rayleighPhase( float cosTheta ) {
        return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
      }

      float hgPhase( float cosTheta, float g ) {
        float g2 = pow( g, 2.0 );
        float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
        return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
      }

      void main() {

        vec3 direction = normalize( vWorldPosition - cameraPos );

      // optical length
      // cutoff angle at 90 to avoid singularity in next formula.
        float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
        float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
        float sR = rayleighZenithLength * inverse;
        float sM = mieZenithLength * inverse;

      // combined extinction factor
        vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

      // in scattering
        float cosTheta = dot( direction, vSunDirection );

        float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
        vec3 betaRTheta = vBetaR * rPhase;

        float mPhase = hgPhase( cosTheta, mieDirectionalG );
        vec3 betaMTheta = vBetaM * mPhase;

        vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
        Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

      // nightsky
        float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
        float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
        vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
        vec3 L0 = vec3( 0.1 ) * Fex;

      // composition + solar disc
        float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
        L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

        vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

        vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

        gl_FragColor = vec4( retColor, 1.0 );

      #include <tonemapping_fragment>
      #include <${a.r>=154?"colorspace_fragment":"encodings_fragment"}>

      }
    `},t=new o.BKk({name:"SkyShader",fragmentShader:e.fragmentShader,vertexShader:e.vertexShader,uniforms:o.LlO.clone(e.uniforms),side:o.hsX,depthWrite:!1});class i extends o.eaF{constructor(){super(new o.iNn(1,1,1),t)}}return s(i,"SkyShader",e),s(i,"material",t),i})();function u(e,t,i=new o.Pq0){let n=Math.PI*(e-.5),r=2*Math.PI*(t-.5);return i.x=Math.cos(r),i.y=Math.sin(n),i.z=Math.sin(r),i}let f=r.forwardRef(({inclination:e=.6,azimuth:t=.1,distance:i=1e3,mieCoefficient:a=.005,mieDirectionalG:l=.8,rayleigh:s=.5,turbidity:f=10,sunPosition:m=u(e,t),...d},v)=>{let h=r.useMemo(()=>new o.Pq0().setScalar(i),[i]),[p]=r.useState(()=>new c);return r.createElement("primitive",(0,n.A)({object:p,ref:v,"material-uniforms-mieCoefficient-value":a,"material-uniforms-mieDirectionalG-value":l,"material-uniforms-rayleigh-value":s,"material-uniforms-sunPosition-value":m,"material-uniforms-turbidity-value":f,scale:h},d))})},16743(e,t,i){let n,r;i.d(t,{E:()=>x});var o=i(44320),a=i(57140),l=i(84668),s=i(67199),c=i(46975);let u=new s.Pq0,f=new s.Pq0,m=new s.Pq0,d=new s.I9Y;function v(e,t,i){let n=u.setFromMatrixPosition(e.matrixWorld);n.project(t);let r=i.width/2,o=i.height/2;return[n.x*r+r,-(n.y*o)+o]}let h=e=>1e-10>Math.abs(e)?0:e;function p(e,t,i=""){let n="matrix3d(";for(let i=0;16!==i;i++)n+=h(t[i]*e.elements[i])+(15!==i?",":")");return i+n}let g=(n=[1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1],e=>p(e,n)),y=(r=e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1],(e,t)=>p(e,r(t),"translate(-50%,-50%)")),x=a.forwardRef(({children:e,eps:t=.001,style:i,className:n,prepend:r,center:p,fullscreen:x,portal:P,distanceFactor:M,sprite:E=!1,transform:w=!1,occlude:b,onOcclude:S,castShadow:R,receiveShadow:T,material:C,geometry:z,zIndexRange:W=[0x1000037,0],calculatePosition:A=v,as:F="div",wrapperClass:I,pointerEvents:$="auto",..._},k)=>{let{gl:B,camera:D,scene:L,size:N,raycaster:O,events:j,viewport:q}=(0,c.C)(),[H]=a.useState(()=>document.createElement(F)),V=a.useRef(null),G=a.useRef(null),K=a.useRef(0),Z=a.useRef([0,0]),U=a.useRef(null),X=a.useRef(null),Y=(null==P?void 0:P.current)||j.connected||B.domElement.parentNode,J=a.useRef(null),Q=a.useRef(!1),ee=a.useMemo(()=>{var e;return b&&"blending"!==b||Array.isArray(b)&&b.length&&(e=b[0])&&"object"==typeof e&&"current"in e},[b]);a.useLayoutEffect(()=>{let e=B.domElement;b&&"blending"===b?(e.style.zIndex=`${Math.floor(W[0]/2)}`,e.style.position="absolute",e.style.pointerEvents="none"):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[b]),a.useLayoutEffect(()=>{if(G.current){let e=V.current=l.createRoot(H);if(L.updateMatrixWorld(),w)H.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{let e=A(G.current,D,N);H.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return Y&&(r?Y.prepend(H):Y.appendChild(H)),()=>{Y&&Y.removeChild(H),e.unmount()}}},[Y,w]),a.useLayoutEffect(()=>{I&&(H.className=I)},[I]);let et=a.useMemo(()=>w?{position:"absolute",top:0,left:0,width:N.width,height:N.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:p?"translate3d(-50%,-50%,0)":"none",...x&&{top:-N.height/2,left:-N.width/2,width:N.width,height:N.height},...i},[i,p,x,N,w]),ei=a.useMemo(()=>({position:"absolute",pointerEvents:$}),[$]);a.useLayoutEffect(()=>{var t,r;Q.current=!1,w?null==(t=V.current)||t.render(a.createElement("div",{ref:U,style:et},a.createElement("div",{ref:X,style:ei},a.createElement("div",{ref:k,className:n,style:i,children:e})))):null==(r=V.current)||r.render(a.createElement("div",{ref:k,style:et,className:n,children:e}))});let en=a.useRef(!0);(0,c.D)(e=>{if(G.current){D.updateMatrixWorld(),G.current.updateWorldMatrix(!0,!1);let e=w?Z.current:A(G.current,D,N);if(w||Math.abs(K.current-D.zoom)>t||Math.abs(Z.current[0]-e[0])>t||Math.abs(Z.current[1]-e[1])>t){var i;let t,n,r,o,a=(i=G.current,t=u.setFromMatrixPosition(i.matrixWorld),n=f.setFromMatrixPosition(D.matrixWorld),r=t.sub(n),o=D.getWorldDirection(m),r.angleTo(o)>Math.PI/2),l=!1;ee&&(Array.isArray(b)?l=b.map(e=>e.current):"blending"!==b&&(l=[L]));let c=en.current;l?en.current=function(e,t,i,n){let r=u.setFromMatrixPosition(e.matrixWorld),o=r.clone();o.project(t),d.set(o.x,o.y),i.setFromCamera(d,t);let a=i.intersectObjects(n,!0);if(a.length){let e=a[0].distance;return r.distanceTo(i.ray.origin)<e}return!0}(G.current,D,O,l)&&!a:en.current=!a,c!==en.current&&(S?S(!en.current):H.style.display=en.current?"block":"none");let v=Math.floor(W[0]/2),p=b?ee?[W[0],v]:[v-1,0]:W;if(H.style.zIndex=`${function(e,t,i){if(t instanceof s.ubm||t instanceof s.qUd){let n=u.setFromMatrixPosition(e.matrixWorld),r=f.setFromMatrixPosition(t.matrixWorld),o=n.distanceTo(r),a=(i[1]-i[0])/(t.far-t.near),l=i[1]-a*t.far;return Math.round(a*o+l)}}(G.current,D,p)}`,w){let[e,t]=[N.width/2,N.height/2],i=D.projectionMatrix.elements[5]*t,{isOrthographicCamera:n,top:r,left:o,bottom:a,right:l}=D,s=g(D.matrixWorldInverse),c=n?`scale(${i})translate(${h(-(l+o)/2)}px,${h((r+a)/2)}px)`:`translateZ(${i}px)`,u=G.current.matrixWorld;E&&((u=D.matrixWorldInverse.clone().transpose().copyPosition(u).scale(G.current.scale)).elements[3]=u.elements[7]=u.elements[11]=0,u.elements[15]=1),H.style.width=N.width+"px",H.style.height=N.height+"px",H.style.perspective=n?"":`${i}px`,U.current&&X.current&&(U.current.style.transform=`${c}${s}translate(${e}px,${t}px)`,X.current.style.transform=y(u,1/((M||10)/400)))}else{let t=void 0===M?1:function(e,t){if(t instanceof s.qUd)return t.zoom;if(!(t instanceof s.ubm))return 1;{let i=u.setFromMatrixPosition(e.matrixWorld),n=f.setFromMatrixPosition(t.matrixWorld);return 1/(2*Math.tan(t.fov*Math.PI/180/2)*i.distanceTo(n))}}(G.current,D)*M;H.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}Z.current=e,K.current=D.zoom}}if(!ee&&J.current&&!Q.current)if(w){if(U.current){let e=U.current.children[0];if(null!=e&&e.clientWidth&&null!=e&&e.clientHeight){let{isOrthographicCamera:t}=D;if(t||z)_.scale&&(Array.isArray(_.scale)?_.scale instanceof s.Pq0?J.current.scale.copy(_.scale.clone().divideScalar(1)):J.current.scale.set(1/_.scale[0],1/_.scale[1],1/_.scale[2]):J.current.scale.setScalar(1/_.scale));else{let t=(M||10)/400,i=e.clientWidth*t,n=e.clientHeight*t;J.current.scale.set(i,n,1)}Q.current=!0}}}else{let t=H.children[0];if(null!=t&&t.clientWidth&&null!=t&&t.clientHeight){let e=1/q.factor,i=t.clientWidth*e,n=t.clientHeight*e;J.current.scale.set(i,n,1),Q.current=!0}J.current.lookAt(e.camera.position)}});let er=a.useMemo(()=>({vertexShader:w?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[w]);return a.createElement("group",(0,o.A)({},_,{ref:G}),b&&!ee&&a.createElement("mesh",{castShadow:R,receiveShadow:T,ref:J},z||a.createElement("planeGeometry",null),C||a.createElement("shaderMaterial",{side:s.$EB,vertexShader:er.vertexShader,fragmentShader:er.fragmentShader})))})},39868(e,t,i){i.d(t,{r:()=>n});let n=parseInt(i(67199).sPf.replace(/\D+/g,""))}}]);