import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import Globe from "three-globe";

function createGlobeData() {
    const N = 20;
    return [...Array(N).keys()].map(() => ({
        startLat: (Math.random() - 0.5) * 180,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 180,
        endLng: (Math.random() - 0.5) * 360,
        color: [
            ["red", "white", "blue", "green"][Math.round(Math.random() * 3)],
            ["red", "white", "blue", "green"][Math.round(Math.random() * 3)],
        ],
    }));
}

/** 弧型链接 */
export default function ArcLinkComponent() {
    const globe = useMemo(() => {
        return new Globe()
            .globeImageUrl(
                "/three-globe/example/img/earth-night.png",
            )
            .arcsData(createGlobeData())
            .arcColor("color")
            .arcDashLength(() => Math.random())
            .arcDashGap(() => Math.random())
            .arcDashAnimateTime(() => Math.random() * 4000 + 500);
    }, []);

    // 每帧旋转
    useFrame(() => {
        globe.rotation.y += 0.002;
    });

    useEffect(() => {
        return () => {
            globe?._destructor();
        }
    }, [globe])

    return <primitive object={globe} />;
}
