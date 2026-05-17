import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFilePath)

const serverPatchMarker = 'programming-foundations:sentry-noisy-catch-all-posts'

const serverPatchSearch = `app.options("*splat", (_req, res) => {
  res.set("Allow", "GET, HEAD, POST, OPTIONS");
  res.sendStatus(204);
});
function getNumberOrNull(value) {`

const serverPatchReplacement = `app.options("*splat", (_req, res) => {
  res.set("Allow", "GET, HEAD, POST, OPTIONS");
  res.sendStatus(204);
});
const noisyCatchAllMutationPrefixes = [
  "/__rsc",
  "/_next",
  "/_rsc",
  "/__nextjs_action",
  "/_middleware",
  "/RSC/"
];
const noisyCatchAllMutationPaths = /* @__PURE__ */ new Set([
  "/",
  "/.action"
]);
function isNoisyCatchAllMutationPath(pathname) {
  return noisyCatchAllMutationPaths.has(pathname) || noisyCatchAllMutationPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : \`\${prefix}/\`)
  );
}
app.all("*splat", (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  if (!isNoisyCatchAllMutationPath(req.path)) return next();

  res.status(404).type("text/plain").send("Not found");
});
// ${serverPatchMarker}
function getNumberOrNull(value) {`

function getWorkshopAppServerPath(epicshopDir = currentDir) {
	return path.join(
		epicshopDir,
		'node_modules',
		'@epic-web',
		'workshop-app',
		'dist',
		'server',
		'index.js',
	)
}

export function patchWorkshopAppServer(source) {
	if (source.includes(serverPatchMarker)) return source

	if (!source.includes(serverPatchSearch)) {
		throw new Error(
			'Could not find the workshop app server insertion point. The upstream server may have changed.',
		)
	}

	return source.replace(serverPatchSearch, serverPatchReplacement)
}

export async function patchWorkshopApp(epicshopDir = currentDir) {
	const serverPath = getWorkshopAppServerPath(epicshopDir)
	const source = await fs.readFile(serverPath, 'utf8')
	const patchedSource = patchWorkshopAppServer(source)

	if (patchedSource === source) {
		console.log('workshop-app server patch already applied')
		return
	}

	await fs.writeFile(serverPath, patchedSource)
	console.log('patched workshop-app server noisy catch-all mutation handling')
}

if (process.argv[1] === currentFilePath) {
	patchWorkshopApp().catch((error) => {
		console.error(error)
		process.exit(1)
	})
}
