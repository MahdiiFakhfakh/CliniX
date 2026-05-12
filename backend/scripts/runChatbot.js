const { execFile, spawn } = require("child_process");
const os = require("os");

const PORT = process.env.CHATBOT_PORT || "8001";
const HOST = process.env.CHATBOT_HOST || "0.0.0.0";

const uvicornArgs = [
  "run",
  "--python",
  "3.12",
  "--with-requirements",
  "requirements.txt",
  "uvicorn",
  "chatbot_service.main:app",
  "--host",
  HOST,
  "--port",
  PORT,
];

function exec(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { windowsHide: true }, (error, stdout) => {
      if (error) {
        resolve("");
        return;
      }
      resolve(stdout);
    });
  });
}

async function findPidsOnPort() {
  if (os.platform() === "win32") {
    const output = await exec("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`,
    ]);

    return [...new Set(output.split(/\s+/).filter(Boolean))];
  }

  const output = await exec("sh", ["-c", `lsof -ti tcp:${PORT} -sTCP:LISTEN`]);
  return [...new Set(output.split(/\s+/).filter(Boolean))];
}

async function stopExistingServer() {
  const currentPid = String(process.pid);
  const pids = (await findPidsOnPort()).filter((pid) => pid !== currentPid);

  if (!pids.length) {
    return;
  }

  console.log(`Port ${PORT} is already in use. Stopping old chatbot process ${pids.join(", ")}...`);

  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      if (os.platform() === "win32") {
        await exec("taskkill.exe", ["/PID", pid, "/F", "/T"]);
      }
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));
}

async function main() {
  await stopExistingServer();

  const command = os.platform() === "win32" ? "uv.exe" : "uv";
  const child = spawn(command, uvicornArgs, {
    stdio: "inherit",
    shell: false,
    windowsHide: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
