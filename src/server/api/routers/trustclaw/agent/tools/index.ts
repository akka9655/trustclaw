import { createScheduleTool } from "./schedule";
import { createDeployWebProjectTool } from "./deploy-web-project";

// Memory tools removed — stateless automation mode saves tokens
// and avoids unnecessary Gemini free-tier API calls.

export function createCustomTools(instanceId: string, userTimezone = "UTC") {
  return {
    schedule: createScheduleTool(instanceId, userTimezone),
    deploy_web_project: createDeployWebProjectTool(),
  };
}
