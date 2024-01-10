// MapComponent.js

import React, { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

const MapComponent = () => {
    mapboxgl.accessToken =
        "pk.eyJ1IjoiaGFtemEzMjQ1IiwiYSI6ImNsbjh6YnNpNTAwY3MycWw1cHYwNXo1N24ifQ.ffBExfXWXnWCoEWIqJzgEg";

    const [map, setMap] = useState(null);

    const initializeMap = () => {
        const initialCoordinates = [43.158157, 20.346822];

        const newMap = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/streets-v12",
            zoom: 2,
            center: initialCoordinates,
        });

        setMap(newMap);
    };

    const showImageOfMap = (result) => {
        console.log("watafak", result);
        let coordinates = [];

        for (let i = 0; i < result.length; i++) {
            if (result[i].lat) {
                const [lat, lon] = [result[i].lat, result[i].lon];
                let temp = [lon, lat];
                coordinates.push(temp);

                let marker = new mapboxgl.Marker({
                    color: "black",
                    rotation: 45,
                })
                    .setLngLat([lon, lat])
                    .addTo(map);
            }
        }

        if (coordinates.length >= 2) {
            console.log("coord", coordinates);
            const geojson = {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: coordinates,
                },
            };

            map.addLayer({
                id: "line",
                type: "line",
                source: {
                    type: "geojson",
                    data: geojson,
                },
                paint: {
                    "line-color": "#86A7FC",
                    "line-width": 10,
                },
            });
        }
    };

    // if result is whole hop from traceroute
    const showWayOnMap = async (result) => {
        const ipInfoToken = "218ef8019d85f5";
        console.log("Called", result);

        try {
            const responses = await Promise.all(
                result.map((item) =>
                    fetch(
                        `https://ipinfo.io/${item.ip}?token=${ipInfoToken}`
                    ).then((response) => response.json())
                )
            );

            showImageOfMap(responses);
        } catch (error) {
            console.error("Error fetching IP information:", error);
        }
    };

    useEffect(() => {
        initializeMap();

        return () => {
            if (map) {
                map.remove();
            }
        };
    }, []);

    const handleMeasureLatencyClick = async () => {
        let curTime = new Date();

        let options = {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        };

        const hostURL = document.querySelector(".usersHostValue").value;
        let formattedTime = curTime.toLocaleTimeString("en-US", options);

        try {
            const result = await fetch(
                `/traceroute?url=${encodeURIComponent(hostURL)}`
            ).then((response) => response.json());

            console.log(result);
            // await showWayOnMap(result); //if results are hops
            let latitude;
            let longitude;
            if (navigator.geolocation) {
                // Get the user's current position
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        latitude = position.coords.latitude;
                        longitude = position.coords.longitude;

                        result.unshift({
                            defLoc: "default",
                            lat: latitude,
                            lon: longitude,
                        });
                        console.log(result);
                        showImageOfMap(result);

                        // Now you can use the latitude and longitude as needed in your application.
                    },
                    (error) => {
                        console.error(
                            `Error getting location: ${error.message}`
                        );
                    }
                );
            } else {
                console.error("Geolocation is not supported by this browser.");
            }
        } catch (error) {
            console.error("Error fetching traceroute data:", error);
        }
    };

    return (
        <div>
            <div id="map" style={{ height: "400px" }}></div>
            <input
                type="text"
                className="usersHostValue"
                placeholder="Enter host URL"
            />
            <button onClick={handleMeasureLatencyClick}>Measure Latency</button>
        </div>
    );
};

export default MapComponent;
