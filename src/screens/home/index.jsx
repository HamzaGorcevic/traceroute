// MapComponent.js

import React, { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { RevolvingDot } from "react-loader-spinner";
const MapComponent = () => {
    mapboxgl.accessToken =
        "pk.eyJ1IjoiaGFtemEzMjQ1IiwiYSI6ImNsbjh6YnNpNTAwY3MycWw1cHYwNXo1N24ifQ.ffBExfXWXnWCoEWIqJzgEg";

    const [map, setMap] = useState(null);
    const [loader, setLoader] = useState(false);
    const [toggler, setToggler] = useState(false);
    const [value, setValue] = useState("");

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
    function clearMap() {
        setToggler(!toggler);
    }
    function getRandomColor() {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    const showImageOfMap = (result) => {
        setLoader(false);
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
                id: `${Math.random()}`,
                type: "line",
                source: {
                    type: "geojson",
                    data: geojson,
                },
                paint: {
                    "line-color": getRandomColor(),
                    "line-width": 10,
                },
            });
        }
    };

    useEffect(() => {
        initializeMap();

        return () => {
            if (map) {
                map.remove();
            }
        };
    }, [toggler]);

    const handleMeasureLatencyClick = async () => {
        setLoader(true);

        let curTime = new Date();

        let options = {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        };
        const hostURL = document.querySelector(".usersHostValue").value;
        let formattedTime = curTime.toLocaleTimeString("en-US", options);
        const result = await fetch(
            `/traceroute?url=${encodeURIComponent(hostURL)}`
        ).then((response) => {
            return response.json();
        });

        console.log(result);
        let latitude;
        let longitude;
        if (navigator.geolocation) {
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
                },
                (error) => {
                    console.error(`Error getting location: ${error.message}`);
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div className="container">
            <div className="infoContainer">
                <h2>Traceroute Online - Trace and Map the Packets Path</h2>
                <p>
                    Utilize traceroute online to perform an advanced visual
                    traceroute that maps and enriches output from mtr. With ASN
                    and Geolocation data to better understand the network path.
                </p>
                <div className="searchContainer">
                    <button className="clearMap" onClick={clearMap}>
                        Clear map
                    </button>
                    <input
                        onChange={(el) => {
                            setValue(el.target.value);
                        }}
                        type="text"
                        className="usersHostValue"
                        placeholder="Enter host URL"
                    />
                    <button onClick={handleMeasureLatencyClick}>
                        Measure Latency
                    </button>
                </div>
            </div>

            <div className="mapContainer">
                <div
                    className="loader"
                    style={{ display: `${loader ? "flex" : "none"}` }}
                >
                    <RevolvingDot
                        visible={true}
                        height="80"
                        width="80"
                        color="#4fa94d"
                        ariaLabel="revolving-dot-loading"
                        wrapperStyle={{}}
                        wrapperClass=""
                    />
                </div>
                <div id="map" style={{ height: "750px", width: "100%" }}></div>
            </div>
        </div>
    );
};

export default MapComponent;
