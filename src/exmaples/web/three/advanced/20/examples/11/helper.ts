export const airportParse = ([
	airportId,
	name,
	city,
	country,
	iata,
	icao,
	lat,
	lng,
	alt,
	timezone,
	dst,
	tz,
	type,
	source,
]: [
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
]) => ({
	airportId,
	name,
	city,
	country,
	iata,
	icao,
	lat,
	lng,
	alt,
	timezone,
	dst,
	tz,
	type,
	source,
});
export const routeParse = ([
	airline,
	airlineId,
	srcIata,
	srcAirportId,
	dstIata,
	dstAirportId,
	codeshare,
	stops,
	equipment,
]: [
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
]) => ({
	airline,
	airlineId,
	srcIata,
	srcAirportId,
	dstIata,
	dstAirportId,
	codeshare,
	stops,
	equipment,
});

type AirPortPoint = {
	lat: number;
	lng: number;
};

export type Plane = {
	airline: string;
	srcIata: string;
	dstIata: string;
	srcAirport: AirPortPoint;
	dstAirport: AirPortPoint;
};
