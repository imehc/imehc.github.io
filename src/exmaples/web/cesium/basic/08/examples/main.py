"""
使用 skyfield 库计算卫星轨道并生成 CZML 文件
"""
import json
from pathlib import Path
from datetime import datetime, timedelta
from skyfield.api import load, EarthSatellite
from sgp4.api import Satrec


def generate_czml_from_tle(satellites_data: list, start_time: datetime, end_time: datetime, step_seconds: int = 60):
    """
    从 TLE 数据生成 CZML 文件

    Args:
        satellites_data: 卫星数据列表，每个元素包含 name, tle_line1, tle_line2, color, size
        start_time: 开始时间
        end_time: 结束时间
        step_seconds: 时间步长（秒）
    """
    ts = load.timescale()

    # CZML 文档结构
    czml = []

    # 添加文档头
    czml.append({
        "id": "document",
        "name": "Satellite Orbits",
        "version": "1.0",
        "clock": {
            "interval": f"{start_time.isoformat()}Z/{end_time.isoformat()}Z",
            "currentTime": f"{start_time.isoformat()}Z",
            "multiplier": 60,
            "range": "LOOP_STOP",
            "step": "SYSTEM_CLOCK_MULTIPLIER"
        }
    })

    # 处理每个卫星
    for sat_data in satellites_data:
        name = sat_data["name"]
        line1 = sat_data["tle_line1"]
        line2 = sat_data["tle_line2"]
        color = sat_data["color"]
        size = sat_data["size"]

        # 创建卫星对象
        satellite = EarthSatellite(line1, line2, name, ts)

        # 生成时间序列
        time_points = []
        positions = []

        current = start_time
        while current <= end_time:
            # 计算卫星位置
            t = ts.utc(current.year, current.month, current.day,
                      current.hour, current.minute, current.second)
            geocentric = satellite.at(t)
            subpoint = geocentric.subpoint()

            # 获取位置（经度、纬度、高度）
            lat = subpoint.latitude.degrees
            lon = subpoint.longitude.degrees
            alt = subpoint.elevation.m  # 米

            # 计算从epoch开始的秒数
            time_offset = (current - start_time).total_seconds()

            # 添加到时间点列表
            time_points.append(current.isoformat() + "Z")
            # CZML 位置格式：[时间偏移, 经度, 纬度, 高度]
            positions.extend([time_offset, lon, lat, alt])

            current += timedelta(seconds=step_seconds)

        # 创建 CZML packet
        packet = {
            "id": name,
            "name": name,
            "availability": f"{start_time.isoformat()}Z/{end_time.isoformat()}Z",
            "billboard": {
                "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QYDCCcnJcfmVQAAAbpJREFUOMuVkk1PE2EQhp/Z7X5AqbRYaBsNakxqPXDw4MGDiT+AG/wF/AceTOTgxYNXL148eLVRPBgTY+KBxIMHCWgUbSmF0pZ2t7vTgwYw8aM1meQ9zDzzvJN3BoBpmub/ykv+OiDLsizLouu6aa01InLpe57nATiOcz+bzT4AEBFxHGfRdd0PAOr1+hwA0zRNAESkVqvNlUqlVwAsy7KMMYYsy7q0Wi1DCCEppQCglLo0TfOTiEgqlUqIiBhjjBBCpFKphGEYr5VS1wFEJBaLvQdQqVRe1uv1PIC6UuojgHw+fzdq23YqEomcHOlHplarLdm2/VJEVgCUSqU5ETFN05xNp9N3ACCdTmdDoZABIJfL3QJQKHQ7Hd1udy2ZTD4HsFqtPltfX1/sdDoHAGzbNkSk0m63PxeLxXkApmmat6LRaFZEarXaXLlcXqzX6wfdbvcEwPHx8QaA1dXVZ5FI5FQ2m50EUCQSSY7H49+NMYZSKhkOhxe6qvVyubxYLBbnAUSj0Y/lcvk5gJOTkwMA1Wo1v7y8fB+A4zj3iqXbtr1kWdY7pdS1TqfzuVQqzXe73UMAh4eH34vF4jcAy8vL9wD8AiKRSCEUCr0EcBZA4QAAAABJRU5ErkJggg==",
                "scale": 1.5,
                "horizontalOrigin": "CENTER",
                "verticalOrigin": "CENTER",
                "color": {
                    "rgba": color
                }
            },
            "label": {
                "text": name,
                "font": "11pt sans-serif",
                "horizontalOrigin": "LEFT",
                "verticalOrigin": "CENTER",
                "pixelOffset": {
                    "cartesian2": [12, 0]
                },
                "fillColor": {
                    "rgba": color
                },
                "outlineColor": {
                    "rgba": [0, 0, 0, 255]
                },
                "outlineWidth": 2,
                "style": "FILL_AND_OUTLINE"
            },
            "position": {
                "interpolationAlgorithm": "LAGRANGE",
                "interpolationDegree": 5,
                "referenceFrame": "FIXED",
                "epoch": f"{start_time.isoformat()}Z",
                "cartographicDegrees": positions
            },
            "path": {
                "show": True,
                "width": 1,
                "material": {
                    "solidColor": {
                        "color": {
                            "rgba": color
                        }
                    }
                },
                "resolution": 120,
                "leadTime": 0,
                "trailTime": 3600  # 显示1小时的轨迹
            }
        }

        czml.append(packet)

    return czml


def main():
    """生成包含多个卫星的 CZML 文件"""

    # 示例 TLE 数据
    satellites = [
        {
            "name": "ISS (ZARYA)",
            "tle_line1": "1 25544U 98067A   25001.50000000  .00016717  00000-0  10270-3 0  9005",
            "tle_line2": "2 25544  51.6400 208.9163 0006317  55.0672  73.1695 15.54225995320456",
            "color": [255, 0, 0, 255],  # 红色
            "size": 8
        },
        {
            "name": "BEIDOU-3 M1",
            "tle_line1": "1 43001U 17069A   25001.50000000  .00000045  00000-0  00000+0 0  9992",
            "tle_line2": "2 43001  55.1397 132.7644 0008537 284.5698 165.5905  1.86232511 42567",
            "color": [0, 255, 0, 255],  # 绿色
            "size": 6
        },
        {
            "name": "GPS BIIR-2",
            "tle_line1": "1 28474U 04045A   25001.50000000 -.00000033  00000-0  00000+0 0  9995",
            "tle_line2": "2 28474  55.3937 261.7145 0128853  37.9216 322.9305  2.00568794146925",
            "color": [0, 0, 255, 255],  # 蓝色
            "size": 6
        },
        {
            "name": "TIANHE",
            "tle_line1": "1 48274U 21035A   25001.50000000  .00004167  00000-0  65152-4 0  9998",
            "tle_line2": "2 48274  41.4697 359.7982 0002417 325.8967 179.3156 15.60458852234789",
            "color": [255, 255, 0, 255],  # 黄色
            "size": 8
        }
    ]

    # 设置时间范围
    start_time = datetime.now()
    end_time = start_time + timedelta(hours=12)  # 模拟12小时的轨道

    # 生成 CZML
    czml_data = generate_czml_from_tle(satellites, start_time, end_time, step_seconds=120)

    # 保存到文件
    output_path = Path(__file__).parent.parent.parent.parent.parent.parent.parent.parent / "static" / "cesium" / "08" / "wx2.czml"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(czml_data, f, indent=2, ensure_ascii=False)

    print(f"✅ CZML 文件已生成: {output_path}")
    print(f"📡 包含 {len(satellites)} 个卫星")
    print(f"⏰ 时间范围: {start_time.strftime('%Y-%m-%d %H:%M:%S')} 到 {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 每个卫星有 {len(czml_data[1]['position']['cartographicDegrees']) // 3} 个位置点")


if __name__ == "__main__":
    main()
