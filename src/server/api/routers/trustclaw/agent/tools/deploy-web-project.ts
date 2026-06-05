import { zodSchema } from "ai";
import type { Tool } from "ai";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { z } from "zod";
import { env } from "~/env";

const deployWebProjectSchema = z.object({
  projectName: z
    .string()
    .describe(
      "The name of the project folder to deploy, e.g. my-portfolio-app",
    ),
  files: z
    .array(
      z.object({
        path: z.string().describe("Relative file path, e.g. index.html or js/app.js"),
        content: z.string().describe("The textual content of the file"),
      }),
    )
    .describe("The files that make up the web project"),
});

type DeployWebProjectInput = z.infer<typeof deployWebProjectSchema>;

interface DeployWebProjectResult {
  success: boolean;
  message: string;
  githubUrl?: string;
  vercelUrl?: string;
}

export function createDeployWebProjectTool(): Tool<
  DeployWebProjectInput,
  DeployWebProjectResult
> {
  return {
    description:
      "Create files for a web project, commit them to a new GitHub repository, and deploy them live to Vercel. GitHub and Vercel tokens are obtained from Composio connections or environment variables.",
    inputSchema: zodSchema(deployWebProjectSchema),
    execute: async ({ projectName, files }) => {
      // Create project directory inside workspace
      const workspaceRoot = process.cwd();
      const projectDir = path.join(workspaceRoot, "projects", projectName);

      try {
        fs.mkdirSync(projectDir, { recursive: true });

        // Write all files
        for (const file of files) {
          const filePath = path.join(projectDir, file.path);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, file.content, "utf8");
        }

        let githubUrl: string | undefined;
        let vercelUrl: string | undefined;
        let logMessage = `Created ${files.length} files locally in projects/${projectName}. `;

        // Resolve GitHub token: prefer env var (which may have been set via Composio connection)
        const githubToken = env.GITHUB_TOKEN;

        // 1. GitHub Deployment if a GitHub token is available
        if (githubToken) {
          try {
            // Create Github Repo via REST API
            const response = await fetch("https://api.github.com/user/repos", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "Basi-jarvis-Agent",
              },
              body: JSON.stringify({
                name: projectName,
                private: false,
                auto_init: false,
              }),
            });

            if (response.ok) {
              const repoData = (await response.json()) as { html_url: string; clone_url: string };
              githubUrl = repoData.html_url;

              // Git push
              const authedCloneUrl = repoData.clone_url.replace(
                "https://",
                `https://x-access-token:${githubToken}@`,
              );

              execSync(
                `git init && git config user.name "Basi-jarvis" && git config user.email "basi-jarvis@ai.com" && git add . && git commit -m "Deploying website via Basi-jarvis" && git branch -M main && git remote add origin ${authedCloneUrl} && git push -u origin main`,
                { cwd: projectDir, stdio: "ignore" },
              );
              logMessage += `Pushed repository to GitHub successfully. `;
            } else {
              const errText = await response.text();
              logMessage += `GitHub repository creation failed: ${errText.slice(0, 100)}. `;
            }
          } catch (gitErr: any) {
            logMessage += `GitHub push error: ${String(gitErr.message || gitErr)}. `;
          }
        } else {
          logMessage += `No GitHub token available. Connect GitHub via Composio or set GITHUB_TOKEN env var. `;
        }

        // Resolve Vercel token: prefer env var (which may have been set via Composio connection)
        const vercelToken = env.VERCEL_TOKEN;

        // 2. Vercel Deployment if a Vercel token is available
        if (vercelToken) {
          try {
            const vercelCmd = `npx --yes vercel --token ${vercelToken} --prod --yes --name ${projectName}`;
            const stdout = execSync(vercelCmd, {
              cwd: projectDir,
              env: { ...process.env, VERCEL_TOKEN: vercelToken },
              encoding: "utf8",
            });

            // Extract Vercel URL from stdout (usually the last line or containing https://)
            const urlMatch = stdout.match(/https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/);
            if (urlMatch) {
              vercelUrl = urlMatch[0];
              logMessage += `Deployed live to Vercel. `;
            } else {
              logMessage += `Vercel deployed, but URL could not be parsed from output. `;
            }
          } catch (vercelErr: any) {
            logMessage += `Vercel deployment error: ${String(vercelErr.message || vercelErr)}. `;
          }
        } else {
          logMessage += `No Vercel token available. Connect Vercel via Composio or set VERCEL_TOKEN env var. `;
        }

        return {
          success: true,
          message: logMessage,
          githubUrl,
          vercelUrl,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Failed to create/deploy project: ${String(err.message || err)}`,
        };
      }
    },
  };
}
