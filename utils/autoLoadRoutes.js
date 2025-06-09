const path = require("path");
const fs = require("fs-extra");

const toRoutePath = (name) => name.toLowerCase();
// Recursive function to scan and load only `.route.js` files from a directory
function autoLoadRoutes(app, baseDir, baseRoute = "/api/v1") {
  const filesAndDirs = fs.readdirSync(baseDir);

  filesAndDirs.forEach((name) => {
    const fullPath = path.join(baseDir, name);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectory
      const newBaseRoute = `${baseRoute}/${toRoutePath(name)}`;
      autoLoadRoutes(app, fullPath, newBaseRoute);
    } else if (stat.isFile() && name.endsWith(".route.js")) {
      // It's a valid route file
      const routeName =
        name === "index.route.js"
          ? ""
          : `/${path.basename(name, ".route.js").toLowerCase()}`;
      const routePath = `${baseRoute}${routeName}`;

      const router = require(fullPath);
      app.use(routePath, router);

      console.log(`Registered route: [${routePath}] -> ${fullPath}`);
    }
  });
}

module.exports = { autoLoadRoutes };
