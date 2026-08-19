import { createRouter } from "./router.js";
import { renderOverview } from "./views/overview.js";
import { renderNewApplication } from "./views/new-application.js";
import { renderApplicationDetail } from "./views/application-detail.js";

const viewElements = {
  overview: document.getElementById("view-overview"),
  newApplication: document.getElementById("view-new-application"),
  applicationDetail: document.getElementById("view-application-detail"),
};

const router = createRouter(
  [
    { pattern: "", view: "overview", render: renderOverview },
    { pattern: "new", view: "newApplication", render: renderNewApplication },
    {
      pattern: "applications/:applicationId",
      view: "applicationDetail",
      render: renderApplicationDetail,
    },
  ],
  viewElements,
);

router.start();
