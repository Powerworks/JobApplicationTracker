/**
 * Minimal hash-based router — no library (research.md). DOM wiring, not unit tested per
 * research.md's testing-scope decision; verified manually via quickstart.md.
 *
 * Routes are registered as { pattern, render(params) }, where pattern is either "" (the "#/"
 * route), a plain segment like "new", or a param segment like "applications/:applicationId".
 */
export const createRouter = (routes, viewElements) => {
  const parse = (hash) => hash.replace(/^#\/?/, "");

  const matchRoute = (path) => {
    for (const route of routes) {
      const patternSegments = route.pattern.split("/").filter(Boolean);
      const pathSegments = path.split("/").filter(Boolean);
      if (patternSegments.length !== pathSegments.length) continue;

      const params = {};
      const matches = patternSegments.every((segment, i) => {
        if (segment.startsWith(":")) {
          params[segment.slice(1)] = pathSegments[i];
          return true;
        }
        return segment === pathSegments[i];
      });
      if (matches) return { route, params };
    }
    return undefined;
  };

  const render = () => {
    const match = matchRoute(parse(window.location.hash));
    for (const element of Object.values(viewElements)) {
      element.hidden = true;
    }
    if (!match) return;
    const viewElement = viewElements[match.route.view];
    viewElement.hidden = false;
    match.route.render(viewElement, match.params);
  };

  window.addEventListener("hashchange", render);

  return { start: render };
};
