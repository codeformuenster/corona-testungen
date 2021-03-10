import cheerio from "cheerio";
import got from "got";
import { writeFile } from "fs";


const url = "https://www.muenster.de/corona_testungen.html";

const loadData = async () => {
  console.log(`Loading ${url}`);
  const response = await got.get(url);
  console.log(`importing ${url}`);
  const $ = cheerio.load(response.body);
  return $("main div.anreisser ul li")
    .map((_, lists) => {
      const place = $(lists);
      let htmlStr = place.html();

      let name, info, address, email;

      // translate email obfuscation into email
      if (htmlStr.includes("writeEmail(")) {
        let start = htmlStr.indexOf("<span");
        let end = htmlStr.indexOf("</script>");

        const parts = htmlStr.slice(start, end).split("'");

        email = `${parts[1]}@${parts[3]}.${parts[5]}`;

        htmlStr = `${htmlStr.slice(0, start)}${htmlStr.slice(end + 9)}`;
      }

      const parts = htmlStr.split(",").map((s) => s.trim());

      switch (parts.length) {
        case 3:
          [name, address, info] = parts;
          if (name === "Dr. Christine Hellwig" && address === "Hoher Heckenweg") {
            address = "Hoher Heckenweg 92B"
          }
          if (name === "Dr. Bernd Unbehaun" && address.includes("(")) {
            const address_new = address.slice(0, address.indexOf("(") - 1)
            info = `${address.slice(address.indexOf("("))}, ${info}`
            address = address_new
          }
          break;
        case 4:
          if (parts[0] === "Ärztehaus Mondstraße") {
            name = parts.slice(0, 3).join(", ");
            address = "Mondstrasse 179 - 181";
          } else if (parts[0] === "Stefan Marschalleck") {
            name = parts[0];
            address = parts[1];
            info = parts[3];
          } else if (parts[0] === "Praxis Dr. Peter Münster") {
            name = parts[0];
            address = parts[1];
            info = parts[3];
          } else {
            info = parts[parts.length - 1];
            address = parts[parts.length - 2];
            name = parts.slice(0, 2).join(", ");
          }
          break;
        case 5:
          if (parts[0] === "Hausarzt in Münster") {
            address = parts[parts.length - 1];
            name = parts.slice(0, 4).join(", ");
          } else if (parts[0] === "HNO münsterland") {
            name = parts.slice(0, 2).join(", ");
            info = parts[parts.length - 2];
            address = parts[parts.length - 3];
          } else {
            info = parts[parts.length - 1];
            address = parts[parts.length - 2];
            name = parts.slice(0, 3).join(", ");
          }
          break;
        case 6:
          if (parts[0] === "HNO münsterland") {
            info = parts[parts.length - 2];
            address = parts[parts.length - 3];
            name = parts.slice(0, 3).join(", ");
          } else {
            info = parts[parts.length - 1];
            address = parts[parts.length - 2];
            name = parts.slice(0, 4).join(", ");
          }
          break;
        case 7:
          info = parts[parts.length - 1];
          address = parts[parts.length - 2];
          name = parts.slice(0, 5).join(", ");
          break;
        default:
          throw new Error(`Cannot handle ${parts.length} parts`);
      }

      if (info && email) {
        info = `${info} ${email}`;
      } else if (email && !info) {
        info = email;
      }

      return { name, address, info };
    })
    .get()
    .flat();
};


const execute = async () => {
  console.log("executing scraper");
  try {
    const sites = await loadData();
    // console.log(sites);
    writeFile("./data.json", JSON.stringify(sites), (error) => {
      if (error) {
        console.log(error);
        throw error;
      } else {
        console.log("success");
      }
    })
  } catch (error) {
    console.error(error);
  }
};

execute();
