import { NominatimJS } from "@owsas/nominatim-js";
import { readFileSync, writeFileSync } from "fs";

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

const search = async (q) => {
  let result = await NominatimJS.search({
    q: `${q} Münster`,
    countrycodes: "de",
  });

  if (result.length !== 1) {
    // try to find a node
    for (const r of result) {
      if (r.osm_type === "node") {
        result = r;
        break;
      }
    }
    if (Array.isArray(result) && result.length === 0) {
      throw new Error(
        `Unable to find a node in ${result.length} results for '${q} Münster'`
      );
    }
    // fall through to blindly picking the first item
  }

  if (Array.isArray(result)) {
    result = result[0];
  }

  const lon = parseFloat(result.lon);
  const lat = parseFloat(result.lat);

  return { lon, lat };
};

const execute = async () => {
  const iteration = 3;
  // load data
  const rawData = readFileSync("./data.json");
  // const rawData = readFileSync(`./geocoded-${iteration - 1}.json`);
  const data = JSON.parse(rawData);

  // create something we can write our data into
  const dataWithCoordinates = JSON.parse(rawData);

  const fc = { type: "FeatureCollection", features: [] };

  for (const [index, item] of data.entries()) {
    if (item.lon) {
      continue;
    }
    try {
      console.log(`Geocoding ${item.address}`);
      const result = await search(item.address);
      dataWithCoordinates[index] = { ...dataWithCoordinates[index], ...result };
      fc.features.push({
        type: "Feature",
        properties: item,
        geometry: {
          type: "Point",
          coordinates: [result.lon, result.lat],
        },
      });
      console.log("done");
    } catch (err) {
      console.log(
        `Received error ${err} for ${JSON.stringify(item)}. Continuing`
      );
    }
    await timeout(2000);
  }

  writeFileSync("./corona-testungen-muenster-geo.json", JSON.stringify(fc));

  writeFileSync(
    `./geocoded-${iteration}.json`,
    JSON.stringify(dataWithCoordinates)
  );
  console.log("success");
};

execute();
