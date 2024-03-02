// MapComponent.js

import React, { useContext, useEffect, useMemo, useState } from "react";
import mapboxgl from "mapbox-gl";
import { RevolvingDot } from "react-loader-spinner";
import Sidebar from "./sidebar";
import { CoordsContext } from "../../contex";
const MapComponent = () => {
    mapboxgl.accessToken =
        "pk.eyJ1IjoiaGFtemEzMjQ1IiwiYSI6ImNsbjh6YnNpNTAwY3MycWw1cHYwNXo1N24ifQ.ffBExfXWXnWCoEWIqJzgEg";

    const url = "http://localhost:8080";
    // const url = "https://tracerouter-servrer.onrender.com";
    // const url = "http://localhost:5000";

    const [map, setMap] = useState(null);
    const [loader, setLoader] = useState(false);
    const [toggler, setToggler] = useState(false);
    const [value, setValue] = useState("");
    const [icon, setIcon] = useState("");
    const [hops, setHops] = useState([]);
    const { coords } = useContext(CoordsContext);

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
        let coordinates = [];
        console.log(result);
        for (let i = 0; i < result.length; i++) {
            if (result[i] != "1") {
                const [lat, lon] = [result[i].latitude, result[i].longitude];

                let tempLon = lon.toString().split(".");
                let tempLat = lat.toString().split(".");

                if (tempLon.length > 2) {
                    tempLon.pop();
                }
                if (tempLat.length > 2) {
                    tempLat.pop();
                }

                const newLon = parseFloat(tempLon.join("."));
                const newLat = parseFloat(tempLat.join("."));

                let temp = [newLon + i / 1000, newLat + i / 1000];

                [result[i].longitude, result[i].latitude] = temp;
                coordinates.push(temp);

                var popup = new mapboxgl.Popup({
                    className: "custom-popup",
                }).setHTML(
                    `<p>${result[i].country_name}</p><p>${i}.hop</p><p>${result[i].city}</p><p>ip:address ${result[i].ip}</p><p>lat: ${result[i].latitude} lon: ${result[i].longitude}</p>`
                );

                if (!isNaN(temp[0])) {
                    let marker = new mapboxgl.Marker({
                        color: "blue",
                        rotation: 45,
                    })
                        .setLngLat(temp)
                        .addTo(map)
                        .setPopup(popup);
                }
            }
        }
        setHops(result);

        if (coordinates.length >= 2) {
            const segmentColors = Array.from(
                { length: coordinates.length - 1 },
                getRandomColor
            );

            for (let i = 0; i < coordinates.length - 1; i++) {
                const startCoord = coordinates[i];
                const endCoord = coordinates[i + 1];

                const segmentGeojson = {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: [startCoord, endCoord],
                    },
                };

                map.addLayer({
                    id: `${Math.random()}`,
                    type: "line",
                    source: {
                        type: "geojson",
                        data: segmentGeojson,
                    },
                    paint: {
                        "line-color": segmentColors[i],
                        "line-width": 10,
                        "line-offset": 5,
                    },
                });
            }
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
    useEffect(() => {
        if (map) {
            map.flyTo({
                zoom: 20,
                center: coords,
                speed: 3,
            });
        }
    }, [coords]);

    function isPrivateIPAddress(ip) {
        const privateIPRegex = /^(?:10|127|169\.254|192\.168)\./;
        const privateIPRangeRegex = /^172\.(1[6-9]|2[0-9]|3[0-1])\./;
        return privateIPRegex.test(ip) || privateIPRangeRegex.test(ip);
    }

    const handleMeasureLatencyClick = async (e) => {
        if (e.key == "Enter" || e.type == "click") {
            setLoader(true);

            //  currently working on !

            const hostURL = document.querySelector(".usersHostValue").value;
            setIcon(`https://icon.horse/icon/${hostURL}`);

            let hops = await fetch(url + `/traceroute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ destination: hostURL }), // Use "destination" as the key
            })
                .then((response) => {
                    return response.json();
                })
                .then((res) => {
                    return res;
                })
                .catch((err) => {
                    console.log("ERROR:", err);
                    return [];
                });

            hops.unshift({ ip: "" });
            console.log(hops);
            const result = await Promise.all(
                hops.map(async (item) => {
                    console.log(item);
                    if (
                        item.ip.trim() == "Request timed out." ||
                        item.ip.trim() == "Trace complete." ||
                        isPrivateIPAddress(item.ip)
                    ) {
                        return "1";
                    }

                    const response = await fetch(
                        `https://api.ipgeolocation.io/ipgeo?apiKey=390b7bba2614408cab65ac286cdfffd1&ip=${item.ip}`
                    )
                        .then((el) => el.json())
                        .then((res) => res)
                        .catch((er) => {
                            return { ip: "" };
                        });
                    console.log(response);
                    return response;
                })
            );
            console.log("result:", result);
            showImageOfMap(result);
        }
    };

    const sidebar = useMemo(() => {
        return <Sidebar hops={hops} icon={icon} />;
    }, [hops, icon]);

    async function giveMEMEME() {
        const response = await fetch(url + "/test");

        const data = await response.json();
        console.log(data);
    }

    return (
        <div className="container">
            <div className="infoContainer">
                <h2>Traceroute Online - Trace and Map the Packets Path</h2>
                <p>
                    Utilize traceroute online to perform an advanced visual
                    traceroute that maps and enriches output from mtr. With ASN
                    and Geolocation data to better understand the network path.
                </p>
                <button onClick={giveMEMEME}>GIVE ME MEME</button>
            </div>

            <div className="searchContainer">
                <input
                    onChange={(el) => {
                        setValue(el.target.value);
                    }}
                    type="text"
                    className="usersHostValue"
                    placeholder="Enter host URL"
                    onKeyDown={handleMeasureLatencyClick}
                />
                <button onClick={handleMeasureLatencyClick}>
                    Measure Latency
                </button>
            </div>
            <div className="containerMapSidebar">
                <div className="mapContainer">
                    <button className="clearMap" onClick={clearMap}>
                        Clear map
                    </button>
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

                    <div
                        id="map"
                        style={{ height: "100%", width: "100%" }}
                    ></div>
                </div>
                {sidebar}
            </div>
        </div>
    );
};

export default MapComponent;
