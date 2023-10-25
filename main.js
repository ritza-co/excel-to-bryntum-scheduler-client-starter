import { Scheduler } from "@bryntum/scheduler";
import "@bryntum/scheduler/scheduler.stockholm.css";
import "./style.css";

const schedulerStartDate = new Date(2024, 9, 1);
const schedulerEndDate = new Date(2024, 10, 1);

const scheduler = new Scheduler({
  appendTo: document.body,
  startDate: schedulerStartDate,
  endDate: schedulerEndDate,
  viewPreset: "weekAndDayLetter",
  zoomOnTimeAxisDoubleClick: false,
  zoomOnMouseWheel: false,

  project: {
    eventsData: [
      {
        id: 0,
        name: "Scope",
        startDate: "2024-10-01",
        resourceId: 1,
        endDate: "2024-10-04",
      },
    ],
    resourcesData: [
      {
        id: 1,
        name: "Jane",
      },
    ],
  },
  columns: [
    {
      type: "resourceInfo",
      text: "Workers",
      image: false,
      width: 150,
    },
  ],
});
