// Force-download a file from a URL without ever showing it inline in the browser.
// Fetches the file as a blob and saves it (guarantees a download, no preview);
// if the fetch is blocked (e.g. CORS), falls back to a direct anchor navigation,
// relying on the server's attachment disposition.

function triggerAnchor(href, filename) {
	const a = document.createElement('a');
	a.href = href;
	a.download = filename;
	a.rel = 'noopener';
	document.body.appendChild(a);
	a.click();
	a.remove();
}

export async function downloadFromUrl(url, filename = 'download') {
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const blob = await res.blob();
		const blobUrl = URL.createObjectURL(blob);
		triggerAnchor(blobUrl, filename);
		setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
	} catch {
		// Fallback: navigate to the URL; the signed certificate URL carries an
		// attachment disposition, so the browser downloads instead of showing it.
		triggerAnchor(url, filename);
	}
}
