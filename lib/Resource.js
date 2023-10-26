import { ResourceModel } from "@bryntum/scheduler";

// Simple resource class with an extra available days field
export default class Resource extends ResourceModel {
  static get fields() {
    return [{ name: "availableDays", defaultValue: 0 }];
  }
}
