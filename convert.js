import got from "got";
import { writeFileSync } from "fs";
import sanitizeHtml from "sanitize-html";

const url = "https://geo.stadt-muenster.de/coronatests/data.php";

const loadData = async () => {
  const response = await got.get(url);
  // endpoint is a jsonp endpoint, strip away stuff that makes JSON.parse fail
  let jsonStr = response.body;
  jsonStr = jsonStr.slice(0, jsonStr.lastIndexOf(";"));
  jsonStr = jsonStr.replace(/var\s.*\s=\s{/i, "{");
  return JSON.parse(jsonStr);
};

// copied from original map https://geo.stadt-muenster.de/coronatests/
const anmeldType = {
  A_TELMAIL: "Anmeldung per Mail oder telefonisch",
  A_HOMEPAGE: "Anmeldung online",
  X: "Anmeldung nicht erforderlich",
};

const artType = {
  ARZT: "Arzt",
  APO: "Apotheke",
  T_ZENTER: "Testcenter",
};

const execute = async () => {
  const json = await loadData();

  const fc = { type: "FeatureCollection", features: [] };

  // sanitize properties
  for (const feature of json.features) {
    let { name, str_name, hsnr, ...props } = feature.properties;

    const address = `${sanitizeHtml(str_name)} ${sanitizeHtml(hsnr)}`.trim();

    name = sanitizeHtml(name).trim();

    const info = Object.entries(props)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => {
        if (key === "art") {
          return artType[value];
        }
        if (key === "anmeld") {
          return anmeldType[value];
        }

        const safeValue = sanitizeHtml(value).trim();

        if (safeValue && key === "email") {
          return `<a href="mailto:${safeValue}">${safeValue}</a>`;
        }
        if (safeValue && key === "homepage") {
          return `<a target="_blank" rel="noopener" href="${safeValue}">${safeValue}</a>`;
        }
        if (safeValue && key === "tel1") {
          return `<a href="tel:${safeValue}">${safeValue}</a>`;
        }
        if (safeValue && key === "besonders") {
          return `Hinweis: ${safeValue}`;
        }

        return safeValue;
      })
      .filter((p) => p)
      .join(", ");

    const properties = {
      name,
      address,
      info,
    };

    fc.features.push({
      type: "Feature",
      properties,
      geometry: feature.geometry,
    });
  }

  // sort by name
  fc.features.sort(
    ({ properties: { name: nameA } }, { properties: { name: nameB } }) =>
      nameA.localeCompare(nameB)
  );

  writeFileSync(
    "./corona-testungen-muenster-extracted.json",
    JSON.stringify(fc, undefined, 2)
  );
};

execute();
