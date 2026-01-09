/** fork @link https://github.com/mbostock/solar-calculator */

/**
 * 计算给定日期距离J2000.0历元的世纪数
 * @param date 日期对象或时间戳（毫秒）
 * @returns 从J2000.0历元（2000年1月1日12时）开始经过的世纪数（36525天为一个世纪）
 */
export function century(date: number | Date) {
    if (date instanceof Date) {
        date = date.getTime();
    }
    const epoch = Date.UTC(2000, 0, 1, 12); // J2000.0
    return (date - epoch) / 315576e7;
}

/**
 * 计算时间方程（Equation of Time），即太阳时和平太阳时之间的差异
 * 时间方程描述了一年中每一天太阳时与平太阳时的差异，以分钟为单位
 * @link https://en.wikipedia.org/wiki/Equation_of_time
 * @param t 日期对象或时间戳（毫秒）
 * @returns 时间方程的值（以分钟为单位），表示太阳时与平太阳时的差异
 */
export function equationOfTime(t: number) {
    const epsilon = obliquityOfEcliptic(t),
        l0 = meanLongitude(t),
        e = orbitEccentricity(t),
        m = meanAnomaly(t),
        y = Math.tan(radians(epsilon) / 2) ** 2,
        sin2l0 = Math.sin(2 * radians(l0)),
        sinm = Math.sin(radians(m)),
        cos2l0 = Math.cos(2 * radians(l0)),
        sin4l0 = Math.sin(4 * radians(l0)),
        sin2m = Math.sin(2 * radians(m)),
        Etime =
            y * sin2l0 -
            2 * e * sinm +
            4 * e * y * sinm * cos2l0 -
            0.5 * y * y * sin4l0 -
            1.25 * e * e * sin2m;
    return degrees(Etime) * 4;
}

/**
 * 返回太阳的平均经度度。
 * @link https://en.wikipedia.org/wiki/Mean_longitude
 * @param t 从J2000.0历元开始计算的世纪数
 * @returns 太阳的平均经度（以度为单位），范围在0到360度之间
 */
export function meanLongitude(t: number) {
    const l = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    // 确保结果在0到360度范围内
    return l < 0 ? l + 360 : l;
}

/**
 * 计算太阳的平均近点角（Mean Anomaly）
 * @link https://en.wikipedia.org/wiki/Mean_anomaly
 * @param t 从J2000.0历元开始计算的世纪数
 * @returns 太阳的平均近点角（以度为单位）
 */
export function meanAnomaly(t: number) {
    const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    return m;
}

/**
 * 获取地球的黄经（Ecliptic Longitude）
 * @link https://en.wikipedia.org/wiki/Ecliptic_longitude
 * @param t 从J2000.0历元开始计算的世纪数
 * @returns 地球的黄经（以度为单位）
 */
export function obliquityOfEcliptic(t: number) {
    const e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60,
        omega = 125.04 - 1934.136 * t,
        e = e0 + 0.00256 * Math.cos(radians(omega));
    return e;
}

/**
 * 获取地球的轨道偏心率
 * @link https://en.wikipedia.org/wiki/Orbital_eccentricity
 * @param t 从J2000.0历元开始计算的世纪数
 * @returns 地球的轨道偏心率
 */
export function orbitEccentricity(t: number) {
    return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

/**
 * 角度转弧度
 * @param degrees 角度
 * @returns 弧度
 */
export function radians(degrees: number) {
    return (Math.PI * degrees) / 180;
}

/**
 * 弧度转角度
 * @param radians 弧度
 * @returns 角度
 */
export function degrees(radians: number) {
    return (180 * radians) / Math.PI;
}

/**
 * 计算太阳的中心方程（Equation of Center），用于修正从平均异常到真实异常的角度
 * 这是一个天文学计算，用于确定太阳的真实位置
 * @link https://en.wikipedia.org/wiki/Equation_of_center
 * @param t 从J2000.0历元开始计算的世纪数
 * @returns 太阳的中心方程值（以度为单位），用于修正平均异常到真实异常
 */
export function equationOfCenter(t: number) {
    const m = radians(meanAnomaly(t)),
        sinm = Math.sin(m),
        sin2m = Math.sin(m * 2),
        sin3m = Math.sin(m * 3);
    return (
        sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) +
        sin2m * (0.019993 - 0.000101 * t) +
        sin3m * 0.000289
    );
}

/**
 * 计算太阳的真经度（True Longitude）
 * 真经度是太阳的实际经度位置，等于平均经度加上中心方程的修正值
 * @param t 从J2000.0历元开始计算的世纪数
 * @returns 太阳的真经度（以度为单位）
 */
export function trueLongitude(t: number) {
    return meanLongitude(t) + equationOfCenter(t);
}

/**
 * 计算太阳的视黄经（Apparent Longitude）
 * 根据天文学定义，这是考虑了章动（nutation）和岁差（precession）影响后的太阳视位置
 * @param t 从J2000.0历元开始计算的世纪数
 * @returns 太阳的视黄经（以度为单位）
 */
export function apparentLongitude(t: number) {
    return trueLongitude(t) - 0.00569 - 0.00478 * Math.sin(radians(125.04 - 1934.136 * t));
}

/**
 * 将输入的日期转换为当天的起始时间（UTC 00:00:00）的 Date 对象
 * @param date 日期对象或时间戳（毫秒）
 * @returns 表示当天开始时间（UTC 00:00:00）的 Date 对象
 */
export function day(date: number | Date) {
    if (!(date instanceof Date)) {
        date = new Date(+date);
    }
    date = new Date(+date);
    date.setUTCHours(0, 0, 0, 0);
    return date;
}

/**
 * 计算太阳的赤纬（Declination）
 * 赤纬是太阳相对于地球赤道平面的角位置，是天文学中重要的坐标参数
 * @param t 从J2000.0历元开始计算的世纪数
 * @returns 太阳的赤纬（以度为单位），正值表示太阳在北半球，负值表示在南半球
 */
export function declination(t: number) {
    return degrees(
        Math.asin(
            Math.sin(radians(obliquityOfEcliptic(t))) *
            Math.sin(radians(apparentLongitude(t))),
        ),
    );
}

/**
 * 计算太阳的日出时角（Rise Hour Angle）
 * 时角表示太阳相对于当地子午线的角度位置，用于确定日出和日落的时间
 * @param date 日期对象或时间戳（毫秒）
 * @param latitude 观测地点的地理纬度（以度为单位）
 * @returns 日出时角（以度为单位），表示太阳在地平线以下的角度
 */
export function riseHourAngle(date: number | Date, latitude: number) {
    const phi = radians(latitude),
        theta = radians(declination(century(date)));
    return -degrees(
        Math.acos(
            Math.cos(radians(90.833)) / (Math.cos(phi) * Math.cos(theta)) -
            Math.tan(phi) * Math.tan(theta),
        ),
    );
}

/**
 * 计算太阳在一天中的有效日照小时数
 * 根据给定日期和纬度，计算该位置的日照时间长度
 * @param date 日期对象或时间戳（毫秒）
 * @param latitude 观测地点的地理纬度（以度为单位）
 * @returns 该日期和纬度下的日照小时数，如果无法计算则返回极昼或极夜的判断值
 */
export function hour(date: number | Date, latitude: number) {
    let delta = -riseHourAngle(date, latitude);
    if (Number.isNaN(delta)) {
        delta = declination(century(date));
        delta = declination(century(date));
        return Number((latitude < 0 ? delta < 0.833 : delta > -0.833)) * 24;
    }
    return (8 * delta) / 60;
}

/**
 * 计算指定日期和经度的正午时间
 * @param date - 输入的日期，可以是时间戳或Date对象
 * @param longitude - 经度值（以度为单位）
 * @returns 返回计算出的正午时间的Date对象
 */
export function noon(date: number | Date, longitude: number) {
    const t = century(+day(date) + (12 - (longitude * 24) / 360) * 36e5), // First approximation.
        o1 = 720 - longitude * 4 - equationOfTime(t - longitude / (360 * 36525)), // First correction.
        o2 = 720 - longitude * 4 - equationOfTime(t + o1 / (1440 * 36525)); // Second correction.
    return new Date(+day(date) + o2 * 1000 * 60);
}

/**
 * 计算太阳升起时间
 * 根据给定日期、纬度和经度，计算太阳升起的具体时间
 * @param date - 输入的日期，可以是时间戳或Date对象
 * @param latitude - 观测地点的地理纬度（以度为单位）
 * @param longitude - 观测地点的地理经度（以度为单位）
 * @returns 返回计算出的太阳升起时间的Date对象
 */
export function rise(date: number | Date, latitude: number, longitude: number) {
    date = noon(date, longitude);
    return new Date(+date + riseHourAngle(date, latitude) * 4 * 1000 * 60);
}

/**
 * 计算太阳落下时间
 * 根据给定日期、纬度和经度，计算太阳落下的具体时间
 * @param date - 输入的日期，可以是时间戳或Date对象
 * @param latitude - 观测地点的地理纬度（以度为单位）
 * @param longitude - 观测地点的地理经度（以度为单位）
 * @returns 返回计算出的太阳落下时间的Date对象
 */
export function set(date: number | Date, latitude: number, longitude: number) {
    date = noon(date, longitude);
    return new Date(+date - riseHourAngle(date, latitude) * 4 * 1000 * 60);
}