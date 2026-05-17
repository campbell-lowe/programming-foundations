import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { patchWorkshopAppServer } from './patch-workshop-app.js'

const serverSource = `app.options("*splat", (_req, res) => {
  res.set("Allow", "GET, HEAD, POST, OPTIONS");
  res.sendStatus(204);
});
function getNumberOrNull(value) {
  if (value == null) return null;
}`

describe('patchWorkshopAppServer', () => {
	it('adds a narrow normal 404 handler for known scanner mutation paths', () => {
		const patchedSource = patchWorkshopAppServer(serverSource)

		assert.match(patchedSource, /programming-foundations:sentry-noisy-catch-all-posts/)
		assert.match(patchedSource, /app\.all\("\*splat"/)
		assert.match(patchedSource, /req\.method === "GET"/)
		assert.match(patchedSource, /req\.method === "HEAD"/)
		assert.match(patchedSource, /req\.method === "OPTIONS"/)
		assert.match(patchedSource, /"\/__rsc"/)
		assert.match(patchedSource, /"\/_next"/)
		assert.match(patchedSource, /"\/_rsc"/)
		assert.match(patchedSource, /"\/__nextjs_action"/)
		assert.match(patchedSource, /"\/_middleware"/)
		assert.match(patchedSource, /"\/RSC\/"/)
		assert.match(patchedSource, /"\/\.action"/)
		assert.match(patchedSource, /res\.status\(404\)/)
	})

	it('does not apply the server patch more than once', () => {
		const patchedSource = patchWorkshopAppServer(serverSource)

		assert.equal(patchWorkshopAppServer(patchedSource), patchedSource)
	})

	it('fails loudly if the upstream server shape changes', () => {
		assert.throws(
			() => patchWorkshopAppServer('app.all("*splat", handler)'),
			/Could not find the workshop app server insertion point/,
		)
	})
})
