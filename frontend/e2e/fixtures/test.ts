import { expect, test as base, type Page } from "@playwright/test";
import { mockSessions } from "./mockData";
import { seedAuthSession, setupMockApi } from "./mockApi";

type AiAgentFixtures = {
  mockApi: void;
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AiAgentFixtures>({
  mockApi: async ({ page }, use) => {
    await setupMockApi(page);
    await use();
  },
  authenticatedPage: async ({ page, mockApi }, use) => {
    void mockApi;
    await seedAuthSession(page, mockSessions.user);
    await use(page);
  },
  adminPage: async ({ page, mockApi }, use) => {
    void mockApi;
    await seedAuthSession(page, mockSessions.admin);
    await use(page);
  }
});

export { expect };
